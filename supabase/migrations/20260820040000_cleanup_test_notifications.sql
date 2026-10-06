-- Remove the notifications created while manually QA-testing the new
-- notifications system in this session.
delete from public.notifications where type in ('test', 'access_request') and title ilike '%QA%';
