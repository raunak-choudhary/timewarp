-- TimeWarp Supabase Schema
-- Run this in the Supabase SQL editor for the timewarp project

-- Enable pgvector extension
create extension if not exists vector;

-- Checkpoints table: every agent node execution is a checkpoint
create table checkpoints (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  parent_id uuid references checkpoints(id),
  node_name text not null,
  timestamp_ns bigint not null,
  state_delta jsonb not null,
  state_hash text not null,
  drift_score float default null,
  is_anomaly boolean default false,
  branch_id uuid default null,
  created_at timestamptz default now()
);

-- Index for time-range queries (segment tree needs this fast)
create index idx_checkpoints_run_time on checkpoints(run_id, timestamp_ns);
create index idx_checkpoints_run_id on checkpoints(run_id);

-- Embeddings table for drift detection
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id uuid references checkpoints(id) on delete cascade,
  embedding vector(384),
  created_at timestamptz default now()
);

-- Baseline embeddings (first N successful runs per node)
create table baseline_embeddings (
  id uuid primary key default gen_random_uuid(),
  node_name text not null,
  embedding vector(384),
  created_at timestamptz default now()
);

create index idx_baseline_node on baseline_embeddings(node_name);
