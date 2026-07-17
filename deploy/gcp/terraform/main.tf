# Profytron GCP — Terraform root
# Project: gen-lang-client-0497144011 | Region: asia-south1
#
# This config is designed to MANAGE the existing live stack (import first),
# not recreate it from scratch and destroy production.
#
# Bootstrap:
#   cd deploy/gcp/terraform
#   terraform init
#   terraform plan
#   # Import existing resources before first apply — see IMPORT.md
#   terraform apply

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # Optional: uncomment after creating a GCS state bucket via scripts/bootstrap-state.ps1
  # backend "gcs" {
  #   bucket = "profytron-tf-state"
  #   prefix = "gcp"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  type    = string
  default = "gen-lang-client-0497144011"
}

variable "region" {
  type    = string
  default = "asia-south1"
}

variable "enable_optional_apis" {
  type        = bool
  default     = true
  description = "Enable Cloud Tasks / Eventarc / Error Reporting / Profiler / Certificate Manager / Network Management"
}

# ─── Selective API enablement (cost-aware) ───────────────────────────────────
locals {
  required_apis = [
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudtrace.googleapis.com",
    "redis.googleapis.com",
    "sqladmin.googleapis.com",
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "storage.googleapis.com",
    "pubsub.googleapis.com",
    "cloudscheduler.googleapis.com",
    "aiplatform.googleapis.com",
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",
  ]

  optional_apis = [
    "cloudtasks.googleapis.com",
    "eventarc.googleapis.com",
    "clouderrorreporting.googleapis.com",
    "cloudprofiler.googleapis.com",
    "certificatemanager.googleapis.com",
    "networkmanagement.googleapis.com",
  ]

  apis = concat(local.required_apis, var.enable_optional_apis ? local.optional_apis : [])
}

resource "google_project_service" "apis" {
  for_each                   = toset(local.apis)
  project                    = var.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

# ─── Artifact Registry ───────────────────────────────────────────────────────
resource "google_artifact_registry_repository" "profytron" {
  location      = var.region
  repository_id = "profytron"
  description   = "Profytron container images (api/web/ai/backtest)"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# ─── Application buckets ─────────────────────────────────────────────────────
resource "google_storage_bucket" "uploads" {
  name                        = "${var.project_id}-uploads"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  versioning { enabled = true }

  lifecycle_rule {
    condition { age = 90 }
    action { type = "SetStorageClass", storage_class = "NEARLINE" }
  }
  lifecycle_rule {
    condition { age = 365 }
    action { type = "SetStorageClass", storage_class = "COLDLINE" }
  }

  cors {
    origin          = ["https://profytron.com", "https://www.profytron.com"]
    method          = ["GET", "PUT", "POST", "HEAD"]
    response_header = ["Content-Type", "Authorization"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket" "backups" {
  name                        = "${var.project_id}-backups"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  versioning { enabled = true }

  lifecycle_rule {
    condition { age = 30 }
    action { type = "SetStorageClass", storage_class = "NEARLINE" }
  }
  lifecycle_rule {
    condition { age = 180 }
    action { type = "SetStorageClass", storage_class = "COLDLINE" }
  }
  lifecycle_rule {
    condition { age = 730 }
    action { type = "Delete" }
  }

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket" "exports" {
  name                        = "${var.project_id}-exports"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  lifecycle_rule {
    condition { age = 30 }
    action { type = "Delete" }
  }

  depends_on = [google_project_service.apis]
}

# ─── Pub/Sub (background work fan-out) ───────────────────────────────────────
resource "google_pubsub_topic" "jobs" {
  name       = "profytron-jobs"
  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "jobs_dlq" {
  name       = "profytron-jobs-dlq"
  depends_on = [google_project_service.apis]
}

resource "google_pubsub_subscription" "jobs_worker" {
  name  = "profytron-jobs-worker"
  topic = google_pubsub_topic.jobs.name

  ack_deadline_seconds = 60
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.jobs_dlq.id
    max_delivery_attempts = 5
  }
}

# ─── Cloud Tasks queue ───────────────────────────────────────────────────────
resource "google_cloud_tasks_queue" "default" {
  count    = var.enable_optional_apis ? 1 : 0
  name     = "profytron-default"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 20
    max_concurrent_dispatches = 10
  }
  retry_config {
    max_attempts       = 8
    min_backoff        = "10s"
    max_backoff        = "300s"
    max_doublings      = 4
    max_retry_duration = "3600s"
  }

  depends_on = [google_project_service.apis]
}

# ─── Outputs ─────────────────────────────────────────────────────────────────
output "artifact_registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.profytron.repository_id}"
}

output "bucket_uploads" { value = google_storage_bucket.uploads.name }
output "bucket_backups" { value = google_storage_bucket.backups.name }
output "bucket_exports" { value = google_storage_bucket.exports.name }
output "pubsub_jobs_topic" { value = google_pubsub_topic.jobs.name }
output "cloud_tasks_queue" {
  value = var.enable_optional_apis ? google_cloud_tasks_queue.default[0].name : null
}
