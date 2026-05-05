-- Create public storage bucket for listing images and policies
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Allow public read access to listing images
drop policy if exists "Public read listing images" on storage.objects;
create policy "Public read listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Allow authenticated users to upload to the listing-images bucket
drop policy if exists "Authenticated upload listing images" on storage.objects;
create policy "Authenticated upload listing images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-images');

-- Allow users to update/delete their own uploads (path prefix = user id)
drop policy if exists "Owner update listing images" on storage.objects;
create policy "Owner update listing images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'listing-images' and (auth.uid()::text = split_part(name, '/', 1)));

drop policy if exists "Owner delete listing images" on storage.objects;
create policy "Owner delete listing images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images' and (auth.uid()::text = split_part(name, '/', 1)));
