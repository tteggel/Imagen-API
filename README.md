# AI Sandbox

## Build
```shell
gcloud builds submit \
  --tag ${GOOGLE_CLOUD_REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/cloud-run-source-deploy/sandbox-ai:latest
```

## Deploy
```shell
gcloud run deploy ${CLOUD_RUN_SERVICE} \
  --image ${GOOGLE_CLOUD_REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/cloud-run-source-deploy/sandbox-ai:latest \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}" \
  --region ${GOOGLE_CLOUD_REGION}
```