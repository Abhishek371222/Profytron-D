import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface StrategyDocumentDto {
  id: string;
  title: string;
  description: string | null;
  downloadUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
  createdAt: Date;
}

@Injectable()
export class StrategyDocumentsService {
  private readonly logger = new Logger(StrategyDocumentsService.name);
  private readonly supabase: ReturnType<typeof createClient> | null;

  constructor(private readonly prisma: PrismaService) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabase = url && key ? createClient(url, key) : null;
  }

  async uploadDocument(
    strategyId: string,
    adminUserId: string,
    file: Express.Multer.File,
    title?: string,
    description?: string,
    sortOrder?: number,
  ): Promise<StrategyDocumentDto> {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id: strategyId, deletedAt: null },
      select: { id: true },
    });
    if (!strategy) {
      throw new NotFoundException('Strategy not found');
    }

    if (!file.buffer || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF documents are supported');
    }

    const docId = randomUUID();
    const storageKey = `${strategyId}/${docId}.pdf`;

    if (!this.supabase) {
      throw new BadRequestException(
        'Document storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
      );
    }

    const { error } = await this.supabase.storage
      .from('strategy-documents')
      .upload(storageKey, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      this.logger.error(`Strategy document upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload document to storage');
    }

    const doc = await this.prisma.strategyDocument.create({
      data: {
        id: docId,
        strategyId,
        title: title?.trim() || file.originalname.replace(/\.pdf$/i, ''),
        description: description?.trim() || null,
        storageKey,
        mimeType: 'application/pdf',
        fileSizeBytes: file.size,
        sortOrder: sortOrder ?? 0,
        uploadedBy: adminUserId,
      },
    });

    return this.toDto(doc);
  }

  async listPublishedDocuments(
    strategyId: string,
  ): Promise<StrategyDocumentDto[]> {
    const docs = await this.prisma.strategyDocument.findMany({
      where: { strategyId, isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return Promise.all(docs.map((doc) => this.toDto(doc)));
  }

  async deleteDocument(strategyId: string, documentId: string): Promise<void> {
    const doc = await this.prisma.strategyDocument.findFirst({
      where: { id: documentId, strategyId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (this.supabase) {
      await this.supabase.storage
        .from('strategy-documents')
        .remove([doc.storageKey]);
    }

    await this.prisma.strategyDocument.delete({ where: { id: documentId } });
  }

  private async toDto(doc: {
    id: string;
    title: string;
    description: string | null;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
    sortOrder: number;
    createdAt: Date;
  }): Promise<StrategyDocumentDto> {
    let downloadUrl = '';
    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from('strategy-documents')
        .createSignedUrl(doc.storageKey, 3600);
      if (!error && data?.signedUrl) {
        downloadUrl = data.signedUrl;
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      downloadUrl,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      sortOrder: doc.sortOrder,
      createdAt: doc.createdAt,
    };
  }
}
