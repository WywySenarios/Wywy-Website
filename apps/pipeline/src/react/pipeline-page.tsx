"use client";

import { PipelineProvider, usePipeline } from "./pipeline-provider";
import { PipelineControl } from "./pipeline-control";

function PipelinePageInner() {
  const ctx = usePipeline();
  return <PipelineControl {...ctx} />;
}

export function PipelinePage() {
  return (
    <PipelineProvider>
      <PipelinePageInner />
    </PipelineProvider>
  );
}
