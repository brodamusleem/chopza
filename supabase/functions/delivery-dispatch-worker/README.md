# Delivery dispatch worker setup

1. Log in and link this folder to the Supabase project, then apply pending migrations (including `0022_in_app_dispatch_notifications.sql`):

   ```sh
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
2. No email provider secrets are needed. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied to deployed Edge Functions by Supabase.
3. Deploy the worker:

   ```sh
   npx supabase functions deploy delivery-dispatch-worker
   ```

4. In the Supabase SQL editor, enable the `pg_cron` and `pg_net` extensions. Store the project function URL and service-role key in Vault, replacing the placeholders without committing the key:

   ```sql
   select vault.create_secret(
     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/delivery-dispatch-worker',
     'delivery_worker_url'
   );
   select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'delivery_worker_token');

   select cron.schedule(
     'delivery-dispatch-worker',
     '* * * * *',
     $$
       select net.http_post(
         url := (select decrypted_secret from vault.decrypted_secrets where name = 'delivery_worker_url'),
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'delivery_worker_token')
         ),
         body := '{}'::jsonb
       );
     $$
   );
   ```

The worker runs once a minute. It alerts admins when a paid order is not accepted by a restaurant within five minutes, expires rider offers after five minutes, assigns the next eligible rider, and stores the resulting alerts in the in-app notification table. An admin can transfer an overdue order to another approved restaurant from the Live Dispatch page.
