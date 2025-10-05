import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import { userFlows, FlowCategory } from '@/data/userFlows';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface FlowchartViewerProps {
  flowId?: string;
}

export function FlowchartViewer({ flowId }: FlowchartViewerProps) {
  const [selectedFlow, setSelectedFlow] = useState<FlowCategory>(
    flowId ? userFlows.find(f => f.id === flowId) || userFlows[0] : userFlows[0]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(selectedFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(selectedFlow.edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleFlowChange = (flow: FlowCategory) => {
    setSelectedFlow(flow);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setSelectedNode(null);
  };

  const handleExport = async () => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    try {
      const canvas = await html2canvas(flowElement, {
        backgroundColor: 'hsl(222.2, 84%, 4.9%)',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `${selectedFlow.id}-flowchart.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Flowchart exported successfully');
    } catch (error) {
      toast.error('Failed to export flowchart');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedFlow.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedFlow.description}</p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export PNG
          </Button>
        </div>

        {/* Flow Selector */}
        <div className="flex gap-2 flex-wrap">
          {userFlows.map((flow) => (
            <Badge
              key={flow.id}
              variant={selectedFlow.id === flow.id ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/90 transition-colors"
              onClick={() => handleFlowChange(flow)}
            >
              {flow.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Flowchart Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
          className="bg-background"
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: 'hsl(217.2 32.6% 27.5%)', strokeWidth: 2 },
          }}
        >
          <Background color="hsl(217.2 32.6% 17.5%)" gap={16} />
          <Controls className="bg-card border border-border rounded-lg" />
          <MiniMap
            className="bg-card border border-border rounded-lg"
            nodeColor={(node) => {
              const style = node.style as any;
              return style?.background || 'hsl(220 70% 50%)';
            }}
          />
          
          {/* Legend Panel */}
          <Panel position="top-right" className="bg-card border border-border rounded-lg p-4 shadow-lg">
            <h3 className="font-semibold text-sm mb-2 text-foreground">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'hsl(220 70% 50%)' }} />
                <span className="text-foreground">Start/Navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'hsl(120 60% 45%)' }} />
                <span className="text-foreground">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'hsl(45 100% 50%)' }} />
                <span className="text-foreground">Warning/Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'hsl(0 70% 55%)' }} />
                <span className="text-foreground">Error/Rejection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'hsl(270 60% 70%)' }} />
                <span className="text-foreground">Admin Action</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Node Details Sidebar */}
        {selectedNode && (
          <Card className="absolute right-4 bottom-4 w-80 p-4 shadow-xl bg-card border-border">
            <h3 className="font-semibold text-foreground mb-2">Node Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Label:</span>
                <p className="font-medium text-foreground">{selectedNode.data.label}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Node ID:</span>
                <p className="text-foreground font-mono text-xs">{selectedNode.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="text-foreground">{selectedNode.type || 'default'}</p>
              </div>
            </div>
            <Button
              onClick={() => setSelectedNode(null)}
              variant="outline"
              size="sm"
              className="mt-4 w-full"
            >
              Close
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
