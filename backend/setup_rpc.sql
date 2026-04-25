create or replace function match_quiz_questions (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  target_difficulty float,
  filter_subject_id text default null,
  filter_branch_name text default null
)
returns table (
  id uuid,
  question_text text,
  options jsonb,
  correct_option text,
  explanation text,
  metadata jsonb,
  primary_concept text,
  similarity float,
  difficulty_diff float,
  final_score float
)
language sql
as $$
  select
    id,
    question_text,
    options,
    correct_option,
    explanation,
    metadata,
    primary_concept,
    1 - (quiz_questions.embedding <=> query_embedding) as similarity,
    abs((metadata->>'difficulty')::float - target_difficulty) as difficulty_diff,
    -- Ranking: High similarity is good, High difficulty_diff is bad.
    (1 - (quiz_questions.embedding <=> query_embedding)) - abs((metadata->>'difficulty')::float - target_difficulty) as final_score
  from quiz_questions
  where 1 - (quiz_questions.embedding <=> query_embedding) > match_threshold
    and (filter_subject_id is null or quiz_questions.subject_id = filter_subject_id)
    and (filter_branch_name is null or quiz_questions.branch_name = filter_branch_name)
  order by final_score desc
  limit match_count;
$$;
