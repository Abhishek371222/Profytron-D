# Import existing live resources BEFORE `terraform apply`.
# Run from deploy/gcp/terraform after `terraform init`.
#
# Artifact Registry (already exists as "profytron" in asia-south1):
#   terraform import google_artifact_registry_repository.profytron projects/gen-lang-client-0497144011/locations/asia-south1/repositories/profytron
#
# Do NOT terraform-manage the two Cloud SQL instances until you decide which
# one is the source of truth. Creating SQL via TF while both exist will
# increase cost further.
#
# Cloud Run services are currently deployed by Cloud Build YAML. Prefer
# keeping deploy in Cloud Build and managing only platform resources
# (APIs, buckets, Pub/Sub, Tasks, AR) in Terraform for now.
