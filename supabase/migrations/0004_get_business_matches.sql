create or replace function get_business_matches(p_profile_id uuid)
returns table (
  business_name text,
  category text,
  phone text,
  neighborhood text,
  website_url text
)
language sql
security invoker
stable
as $$
  select b.name, c.name as category, b.phone, b.neighborhood, b.website_url
  from businesses b
  join categories c on c.id = b.category_id
  where b.category_id in (
    select rc.category_id
    from response_categories rc
    join questionnaire_responses qr on qr.id = rc.response_id
    where qr.profile_id = p_profile_id
  )
  order by
    coalesce(b.neighborhood = (select neighborhood from profiles where id = p_profile_id), false) desc,
    b.name asc
  limit 20;
$$;

grant execute on function get_business_matches(uuid) to anon, authenticated;
