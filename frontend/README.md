To deploy the Cloud Run service:

```bash
gcloud run deploy image-changes-tracking-frontend \
    --source . \
    --region us-central1 \
    --set-env-vars "OAUTH2_PROXY_CLIENT_ID=" \
    --set-env-vars "OAUTH2_PROXY_CLIENT_SECRET=" \
    --set-env-vars "OAUTH2_PROXY_COOKIE_SECRET=" \
    --set-env-vars "OAUTH2_PROXY_EMAIL_DOMAINS=example.com" \
    --allow-unauthenticated
```