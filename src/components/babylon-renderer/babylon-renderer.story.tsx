import useOpenSCADProcessor from "@/features/openscad-processor";
import { PipelineResult } from "@/types/pipeline-types";
import { useEffect } from "react";
import { BabylonRenderer } from "./babylon-renderer";

export const BabylonRenderStory = ({ code: _code }: { code: string }) => {
  const { result, error, isProcessing, processCode } = useOpenSCADProcessor();
  // Mock props for testing
  const pipelineResult =  result as PipelineResult | null;
  const sceneConfig = {
    enableDebugMode: true,
    showAxes: true,
    showGrid: true,
    enableCamera: true,
    enableLighting: true,
    backgroundColor: "#333333",
  };

  // Simulate processing the OpenSCAD code
  useEffect(() => {
    console.log("[TEST] Processing OpenSCAD code:", _code);
    processCode(_code);
  }, [_code, processCode]);

  if (error) {
    console.error("Error in OpenSCAD Processor:", error);
    return <div>Error: {error}</div>;
  }

  if (isProcessing || !pipelineResult) {
    return <div>Processing...</div>;
  }

  console.log("[TEST] Pipeline result:", pipelineResult);
  return (
    <div data-testid="babylon-renderer" style={{ width: "100vw", height: "100vh" }}>
      <BabylonRenderer
        pipelineResult={pipelineResult}
        isProcessing={isProcessing}
        sceneConfig={sceneConfig}
      />
    </div>
  );
};