"use client";

import { useState } from "react";
import { Activity, Crosshair, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { forwardBatch } from "../cache";
import { GEOLOCATION_PIPELINE } from "../config";
import type { PipelineDb, PipelineStats } from "../index";

interface PipelineControlProps {
  pipelineDb: PipelineDb | null;
  stats: PipelineStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function PipelineControl({
  pipelineDb,
  stats,
  loading,
  error,
  refreshStats,
}: PipelineControlProps) {
  const [forwarding, setForwarding] = useState(false);
  const [recording, setRecording] = useState(false);

  const handleForceForward = async () => {
    if (!pipelineDb || forwarding) return;
    setForwarding(true);
    try {
      const pendingRecords = await pipelineDb.getPending(
        GEOLOCATION_PIPELINE.batchSize,
      );
      console.log(
        `[pipeline-control] Force forward: ${pendingRecords.length} pending record(s) found`,
      );
      if (pendingRecords.length === 0) {
        toast("Nothing to forward");
        return;
      }
      const success = await forwardBatch(pendingRecords);
      for (const record of pendingRecords) {
        if (success) {
          await pipelineDb.markForwarded(record.id);
        } else {
          await pipelineDb.incrementRetry(record.id);
        }
      }
      console.log(
        `[pipeline-control] Force forward ${success ? "SUCCEEDED" : "FAILED"} — ${pendingRecords.length} record(s)`,
      );
      await refreshStats();
    } catch (err: any) {
      console.error("[pipeline-control] Force forward error:", err);
      console.error("[pipeline-control] Error details:", {
        type: typeof err,
        message: err?.message ?? String(err),
        code: err?.code,
        stack: err?.stack,
      });
    } finally {
      setForwarding(false);
    }
  };

  const handleRecordNow = async () => {
    if (!pipelineDb || recording) return;
    setRecording(true);
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      const fix = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        altitude: pos.coords.altitude ?? null,
        altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
        timestamp: pos.timestamp,
      };
      await pipelineDb.insert(fix);
      console.log(
        `[pipeline-control] Record Now: fix inserted (${fix.latitude.toFixed(4)}, ${fix.longitude.toFixed(4)}), accuracy=${fix.accuracy}`,
      );
      toast(`Recorded (${fix.latitude.toFixed(4)}, ${fix.longitude.toFixed(4)})`);
      await refreshStats();
    } catch (err: any) {
      console.error("[pipeline-control] Record Now error:", err);
      console.error("[pipeline-control] Record Now error details:", {
        type: typeof err,
        message: err?.message ?? String(err),
        code: err?.code,
        stack: err?.stack,
      });
      toast.error("Failed to record location");
    } finally {
      setRecording(false);
    }
  };

  const handleRefresh = async () => {
    await refreshStats();
  };

  const formatTime = (ts: number | undefined) => {
    if (!ts) return "N/A";
    return new Date(ts).toLocaleString();
  };

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">
            <p className="font-medium">Database unavailable</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pipeline Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !stats ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>Total Records</dt>
                <dd className="font-mono">{stats.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Pending</dt>
                <dd className="font-mono">{stats.pending}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Failed</dt>
                <dd className="font-mono">{stats.failed}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Last Fix</dt>
                <dd className="font-mono text-sm">{formatTime(stats.lastTimestamp)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          onClick={handleRecordNow}
          disabled={recording || loading}
        >
          <Crosshair
            className={`mr-2 h-4 w-4 ${recording ? "animate-pulse" : ""}`}
          />
          {recording ? "Recording..." : "Record Now"}
        </Button>
        <Button
          onClick={handleForceForward}
          disabled={forwarding || loading}
        >
          <Send className="mr-2 h-4 w-4" />
          {forwarding ? "Forwarding..." : "Force Forward"}
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
