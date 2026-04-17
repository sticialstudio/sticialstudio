'use client';

import { useWebSerial } from '@/hooks/useWebSerial';
import { SplitViewEventBusProvider } from './split-view/SplitViewEventBus';
import { EditorOrchestrator } from './split-view/EditorOrchestrator';
import { CircuitOrchestrator } from './split-view/CircuitOrchestrator';
import { CompileController } from './split-view/CompileController';
import { AutoSaveManager } from './split-view/AutoSaveManager';
import IDELayoutContainer from './split-view/IDELayoutContainer';

export default function SplitView() {
  const webSerial = useWebSerial();

  return (
    <SplitViewEventBusProvider>
      <EditorOrchestrator>
        <CircuitOrchestrator>
          <CompileController webSerial={webSerial}>
            <AutoSaveManager webSerial={webSerial}>
              <IDELayoutContainer webSerial={webSerial} />
            </AutoSaveManager>
          </CompileController>
        </CircuitOrchestrator>
      </EditorOrchestrator>
    </SplitViewEventBusProvider>
  );
}