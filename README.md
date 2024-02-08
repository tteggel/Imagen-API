# AI Sandbox

A UI for interacting with Google Imagen2 and Gemini Pro models. 

Inspired by: https://github.com/rk-man/Imagen-API

## Build and deploy to your Google Cloud project
This should Just Work™ but you might need to give your Cloud Run service account some extra permissions and you'll definitely need to have enabled the Vertex API.

1. Make a .env
   ```shell
   GOOGLE_CLOUD_PROJECT=<your Goole Cloud project name>
   GOOGLE_CLOUD_REGION=<the region your CLOUD_RUN_SERVICE is in>
   CLOUD_RUN_SERVICE=<the name of your service>
   PROMPT_GUIDE_LINK=<optional link to docs>
   ```
2. Source your .env e.g. in bash
   ```shell
   set -a
   source .env
   set +a
   ```
   
3. Build
   ```shell
   gcloud builds submit \
     --tag ${GOOGLE_CLOUD_REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/cloud-run-source-deploy/sandbox-ai:latest
   ```

4. Deploy
   ```shell
   gcloud run deploy ${CLOUD_RUN_SERVICE} \
     --image ${GOOGLE_CLOUD_REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/cloud-run-source-deploy/sandbox-ai:latest \
     --set-env-vars "GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}" \
     --set-env-vars "PROMPT_GUIDE_LINK=${PROMPT_GUIDE_LINK}" \
     --region ${GOOGLE_CLOUD_REGION}
   ```