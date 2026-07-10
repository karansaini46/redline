-- Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create hnsw index on Clause.embedding using cosine distance (vector_cosine_ops)
-- (using L2 distance vector_l2_ops is also common, but for embeddings cosine is often preferred. 
-- In our plan we mentioned vector_l2_ops, so let's stick to that for compatibility or default L2)
CREATE INDEX IF NOT EXISTS "Clause_embedding_idx" ON "Clause" USING hnsw (embedding vector_l2_ops);
