import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Express } from 'express';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';

export type StrategyDocumentKind = 'IMAGE' | 'PDF' | 'DATA';

export interface StrategyDocumentDto {
  id: string;
  title: string;
  description: string | null;
  kind: StrategyDocumentKind;
  downloadUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
}

const KIND_MIME: Record<StrategyDocumentKind, string[]> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  PDF: ['application/pdf'],
  DATA: [
    'text/csv',
    'application/json',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

/** No legitimate strategy asset needs more than this; larger is a mistake or abuse. */
const KIND_MAX_BYTES: Record<StrategyDocumentKind, number> = {
  IMAGE: 5 * 1024 * 1024,
  PDF: 10 * 1024 * 1024,
  DATA: 10 * 1024 * 1024,
};

const CSV_MAX_ROWS = 50_000;

@Injectable()
export class StrategyDocumentsService {
  private readonly logger = new Logger(StrategyDocumentsService.name);
  private readonly supabase: ReturnType<typeof createClient> | null;
  private readonly localRoot: string;

  constructor(private readonly prisma: PrismaService) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabase = url && key ? createClient(url, key) : null;
    this.localRoot = path.join(process.cwd(), 'uploads', 'strategy-documents');
    try {
      fs.mkdirSync(this.localRoot, { recursive: true });
    } catch (err: any) {
      // Prefer Supabase in production; local disk is a fallback. Never crash boot
      // if the container filesystem is read-only for this path (e.g. Render).
      this.logger.warn(
        `Local upload dir unavailable (${err?.code || err?.message}); using Supabase-only storage when configured`,
      );
    }
  }

  private normalizeKind(kind?: string): StrategyDocumentKind {
    const value = (kind || 'PDF').toUpperCase();
    if (value === 'IMAGE' || value === 'PDF' || value === 'DATA') return value;
    throw new BadRequestException('kind must be IMAGE, PDF, or DATA');
  }

  private extensionFor(mimeType: string, kind: StrategyDocumentKind) {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (mimeType === 'image/gif') return 'gif';
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/json') return 'json';
    if (mimeType === 'text/csv') return 'csv';
    if (mimeType.includes('sheet')) return 'xlsx';
    if (kind === 'DATA') return 'dat';
    return 'bin';
  }

  /**
   * Verifies the file's actual bytes match its claimed kind — not just the
   * client-supplied mimetype, which is trivially spoofable (a renamed .php
   * file can still declare Content-Type: image/jpeg). For images, also
   * returns a re-encoded buffer with EXIF/metadata stripped so location
   * data doesn't leak through marketplace thumbnails. Throws
   * BadRequestException on anything that fails validation.
   */
  private async validateAndSanitize(
    file: Express.Multer.File,
    kind: StrategyDocumentKind,
  ): Promise<Buffer> {
    const maxBytes = KIND_MAX_BYTES[kind];
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `${kind} file exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB limit`,
      );
    }

    if (kind === 'IMAGE') {
      let metadata: sharp.Metadata;
      try {
        metadata = await sharp(file.buffer).metadata();
      } catch {
        throw new BadRequestException(
          'File is not a valid image — its content does not match a supported image format',
        );
      }
      const format = metadata.format;
      if (!format || !['jpeg', 'png', 'webp', 'gif'].includes(format)) {
        throw new BadRequestException('Unsupported image format');
      }
      try {
        // Re-encoding (no .withMetadata()) strips EXIF/ICC/GPS metadata by
        // default and doubles as content validation — sharp already threw
        // above if the bytes weren't a genuine image of that format.
        return await sharp(file.buffer).rotate().toFormat(format).toBuffer();
      } catch {
        throw new BadRequestException('Could not process image file');
      }
    }

    if (kind === 'PDF') {
      if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
        throw new BadRequestException(
          'File is not a valid PDF — missing the PDF header',
        );
      }
      return file.buffer;
    }

    // DATA
    if (file.mimetype === 'application/json') {
      try {
        JSON.parse(file.buffer.toString('utf8'));
      } catch {
        throw new BadRequestException('File is not valid JSON');
      }
    } else if (file.mimetype === 'text/csv' || file.mimetype === 'text/plain') {
      const text = file.buffer.toString('utf8');
      if (text.includes('\u0000')) {
        throw new BadRequestException(
          'File does not look like a text/CSV file',
        );
      }
      const rowCount = text.split('\n').length;
      if (rowCount > CSV_MAX_ROWS) {
        throw new BadRequestException(
          `CSV has ${rowCount.toLocaleString()} rows — the limit is ${CSV_MAX_ROWS.toLocaleString()}`,
        );
      }
    } else {
      // xlsx is a zip container ('PK'), legacy xls is an OLE container —
      // check the real container magic bytes rather than trusting the
      // extension/declared mimetype.
      const header = file.buffer.subarray(0, 4);
      const isZip = header[0] === 0x50 && header[1] === 0x4b;
      const isOle = header[0] === 0xd0 && header[1] === 0xcf;
      if (!isZip && !isOle) {
        throw new BadRequestException(
          'File does not look like a valid spreadsheet',
        );
      }
    }
    return file.buffer;
  }

  async uploadDocument(
    strategyId: string,
    uploaderId: string,
    file: Express.Multer.File,
    options?: {
      title?: string;
      description?: string;
      sortOrder?: number;
      kind?: string;
      isPublished?: boolean;
      requireOwnership?: boolean;
    },
  ): Promise<StrategyDocumentDto> {
    const kind = this.normalizeKind(options?.kind);
    const strategy = await this.prisma.strategy.findFirst({
      where: { id: strategyId, deletedAt: null },
      select: { id: true, creatorId: true },
    });
    if (!strategy) {
      throw new NotFoundException('Strategy not found');
    }
    if (options?.requireOwnership && strategy.creatorId !== uploaderId) {
      throw new ForbiddenException('Not your strategy');
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('Uploaded file is required');
    }

    const allowed = KIND_MIME[kind];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for ${kind}. Allowed: ${allowed.join(', ')}`,
      );
    }

    // Real content check (size cap, magic bytes / actual parse — not just the
    // declared mimetype) — returns the buffer to actually store, which for
    // images is a re-encoded copy with EXIF/metadata stripped.
    const sanitizedBuffer = await this.validateAndSanitize(file, kind);

    const docId = randomUUID();
    const ext = this.extensionFor(file.mimetype, kind);
    const relativeKey = `${strategyId}/${docId}.${ext}`;
    let storageKey = relativeKey;

    let uploadedToSupabase = false;
    if (this.supabase) {
      try {
        const { error } = await this.supabase.storage
          .from('strategy-documents')
          .upload(relativeKey, sanitizedBuffer, {
            contentType: file.mimetype,
            upsert: false,
          });
        if (error) {
          this.logger.warn(
            `Supabase upload failed, using local storage: ${error.message}`,
          );
        } else {
          uploadedToSupabase = true;
        }
      } catch (error) {
        this.logger.warn(
          `Supabase upload error, using local storage: ${String(error)}`,
        );
      }
    }

    if (!uploadedToSupabase) {
      const dir = path.join(this.localRoot, strategyId);
      try {
        fs.mkdirSync(dir, { recursive: true });
        const localPath = path.join(dir, `${docId}.${ext}`);
        fs.writeFileSync(localPath, sanitizedBuffer);
        storageKey = `local:${strategyId}/${docId}.${ext}`;
      } catch (err: any) {
        throw new BadRequestException(
          `File storage unavailable (${err?.code || 'EACCES'}). Configure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.`,
        );
      }
    }

    const doc = await this.prisma.strategyDocument.create({
      data: {
        id: docId,
        strategyId,
        title:
          options?.title?.trim() ||
          file.originalname.replace(/\.[^.]+$/, '') ||
          `${kind.toLowerCase()}-${docId.slice(0, 8)}`,
        description: options?.description?.trim() || null,
        kind,
        storageKey,
        mimeType: file.mimetype,
        fileSizeBytes: sanitizedBuffer.length,
        sortOrder: options?.sortOrder ?? 0,
        isPublished: options?.isPublished ?? false,
        uploadedBy: uploaderId,
      },
    });

    return this.toDto(doc);
  }

  async listDocuments(
    strategyId: string,
    opts?: { publishedOnly?: boolean },
  ): Promise<StrategyDocumentDto[]> {
    const docs = await this.prisma.strategyDocument.findMany({
      where: {
        strategyId,
        ...(opts?.publishedOnly ? { isPublished: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return Promise.all(docs.map((doc) => this.toDto(doc)));
  }

  async listPublishedDocuments(
    strategyId: string,
  ): Promise<StrategyDocumentDto[]> {
    return this.listDocuments(strategyId, { publishedOnly: true });
  }

  async publishAllForStrategy(strategyId: string) {
    await this.prisma.strategyDocument.updateMany({
      where: { strategyId },
      data: { isPublished: true },
    });
  }

  async deleteDocument(strategyId: string, documentId: string): Promise<void> {
    const doc = await this.prisma.strategyDocument.findFirst({
      where: { id: documentId, strategyId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.storageKey.startsWith('local:')) {
      const localPath = path.join(
        this.localRoot,
        doc.storageKey.replace(/^local:/, ''),
      );
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    } else if (this.supabase) {
      await this.supabase.storage
        .from('strategy-documents')
        .remove([doc.storageKey]);
    }

    await this.prisma.strategyDocument.delete({ where: { id: documentId } });
  }

  async getLocalFilePath(strategyId: string, documentId: string) {
    const doc = await this.prisma.strategyDocument.findFirst({
      where: { id: documentId, strategyId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!doc.storageKey.startsWith('local:')) {
      return null;
    }
    const localPath = path.join(
      this.localRoot,
      doc.storageKey.replace(/^local:/, ''),
    );
    if (!fs.existsSync(localPath)) {
      throw new NotFoundException('File missing on disk');
    }
    return { path: localPath, mimeType: doc.mimeType, title: doc.title };
  }

  private async toDto(doc: {
    id: string;
    strategyId?: string;
    title: string;
    description: string | null;
    kind?: string | null;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
    sortOrder: number;
    isPublished?: boolean;
    createdAt: Date;
  }): Promise<StrategyDocumentDto> {
    let downloadUrl = '';
    const strategyId =
      doc.strategyId ||
      (doc.storageKey.startsWith('local:')
        ? doc.storageKey.replace(/^local:/, '').split('/')[0]
        : doc.storageKey.split('/')[0]);

    if (doc.storageKey.startsWith('local:')) {
      downloadUrl = `/api/strategies/${strategyId}/documents/${doc.id}/file`;
    } else if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from('strategy-documents')
        .createSignedUrl(doc.storageKey, 3600);
      if (!error && data?.signedUrl) {
        downloadUrl = data.signedUrl;
      } else {
        downloadUrl = `/api/strategies/${strategyId}/documents/${doc.id}/file`;
      }
    } else {
      downloadUrl = `/api/strategies/${strategyId}/documents/${doc.id}/file`;
    }

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      kind: (doc.kind as StrategyDocumentKind) || 'PDF',
      downloadUrl,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      sortOrder: doc.sortOrder,
      isPublished: doc.isPublished ?? true,
      createdAt: doc.createdAt,
    };
  }
}
