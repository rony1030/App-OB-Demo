-- Allow MP4 render videos (e.g. Paridera Sunrise) in the public-assets bucket,
-- keeping every mime type already allowed. Size limit (50 MB) is unchanged.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'video/mp4')
where id = 'public-assets'
  and allowed_mime_types is not null
  and not ('video/mp4' = any(allowed_mime_types));
