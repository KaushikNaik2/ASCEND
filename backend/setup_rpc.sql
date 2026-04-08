create or replace function match_quiz_questions (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  target_difficulty float
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
    -- Ranking calculation: High similarity is good, High difficulty_diff is bad.
    -- We subtract the difficulty difference from the semantic similarity to find the "sweet spot".
    (1 - (quiz_questions.embedding <=> query_embedding)) - abs((metadata->>'difficulty')::float - target_difficulty) as final_score
  from quiz_questions
  where 1 - (quiz_questions.embedding <=> query_embedding) > match_threshold
  order by final_score desc
  limit match_count;
$$;
