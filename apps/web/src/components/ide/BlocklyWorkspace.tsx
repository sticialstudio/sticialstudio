"use client";

import BlockEditor from './BlockEditor';

interface BlocklyWorkspaceProps {
  generatorType: string;
  initialXml: string;
  onCodeChange: (code: string) => void;
  onXmlChange: (xml: string) => void;
  selectedCategoryName?: string;
}

export default function BlocklyWorkspace({
  generatorType,
  initialXml,
  onCodeChange,
  onXmlChange,
  selectedCategoryName
}: BlocklyWorkspaceProps) {
  return (
    <section className="h-full min-h-0 rounded-2xl border border-slate-700 bg-slate-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <BlockEditor
        generatorType={generatorType}
        initialXml={initialXml}
        onCodeChange={onCodeChange}
        onXmlChange={onXmlChange}
        selectedCategoryName={selectedCategoryName}
      />
    </section>
  );
}
