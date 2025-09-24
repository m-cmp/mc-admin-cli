

resource "google_firestore_database" "datastore_mode_database" {
  project     = var.project_id     
  location_id = var.region         # Firestore region
  name        = var.nrdbName         # Firestore DB name
  type        = "FIRESTORE_NATIVE" # Firestore type

  # DELETE Policty and State
  deletion_policy = "DELETE"
  delete_protection_state = "DELETE_PROTECTION_DISABLED" # Firestore state

}