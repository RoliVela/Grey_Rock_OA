-- Lets anyone read profiles/responses/categories flagged is_demo = true, so the
-- /demo pages work with no sign-in. Real users' rows stay locked to their own
-- auth.uid() via the existing policies — these are additional (OR'd) policies,
-- scoped narrowly to demo-flagged data only.

create policy "public read demo profiles" on profiles
  for select using (is_demo = true);

create policy "public read demo responses" on questionnaire_responses
  for select using (
    exists (select 1 from profiles p where p.id = profile_id and p.is_demo = true)
  );

create policy "public read demo response categories" on response_categories
  for select using (
    exists (
      select 1 from questionnaire_responses r
      join profiles p on p.id = r.profile_id
      where r.id = response_id and p.is_demo = true
    )
  );
