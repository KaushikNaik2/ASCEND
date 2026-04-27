import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ReactFlow,
  type Node,
  type Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import { Check, X, PlayCircle, FileText, ChevronRight, Sparkles, Loader2, Bot } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getUserRoadmaps, updateTopicProgress } from '../lib/api'
import type { UserRoadmap } from '../lib/api'

// ─── Dagre Layout ───
const DAGRE_OPTS = { rankdir: 'TB', ranksep: 100, nodesep: 60 }

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph(DAGRE_OPTS)

  nodes.forEach((node) => {
    g.setNode(node.id, { width: node.data.width || 240, height: node.data.height || 60 })
  })
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - (node.data.width || 240) / 2,
        y: pos.y - (node.data.height || 60) / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

// ─── Custom Node: Module Header ───
function ModuleNode({ data }: { data: any }) {
  return (
    <div className="px-6 py-4 rounded-2xl bg-indigo-600/90 border-2 border-indigo-400/50 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-sm min-w-[220px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-indigo-300" />
      <p className="text-xs text-indigo-200/80 font-semibold uppercase tracking-wider mb-1">{data.moduleNumber}</p>
      <p className="text-white font-bold text-sm leading-tight">{data.label}</p>
      <p className="text-indigo-200/60 text-[10px] mt-1">{data.topicCount} topics</p>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-indigo-300" />
    </div>
  )
}

// ─── Custom Node: Topic Card ───
function TopicNode({ data }: { data: any }) {
  const isDone = data.status === 'done'
  const isOngoing = data.status === 'ongoing'
  const isSkipped = data.status === 'skipped'

  let borderClass = 'border-white/10 hover:border-indigo-500/50'
  let bgClass = 'bg-slate-900/80'
  let dotClass = 'border-slate-500'

  if (isDone) {
    borderClass = 'border-emerald-500/40'
    bgClass = 'bg-emerald-500/10'
    dotClass = 'bg-emerald-500 border-emerald-500'
  } else if (isOngoing) {
    borderClass = 'border-amber-500/40'
    bgClass = 'bg-amber-500/10'
    dotClass = 'bg-amber-500 border-amber-500'
  } else if (isSkipped) {
    borderClass = 'border-slate-600/40'
    bgClass = 'bg-slate-800/50'
    dotClass = 'bg-slate-500 border-slate-500'
  }

  return (
    <div
      onClick={() => data.onSelect?.(data.topic)}
      className={`px-4 py-3 rounded-xl border ${borderClass} ${bgClass} backdrop-blur-sm min-w-[200px] max-w-[240px] cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${dotClass}`}>
          {isDone && <Check className="w-3 h-3 text-white" />}
          {isOngoing && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          {isSkipped && <div className="w-2.5 h-0.5 bg-white" />}
        </div>
        <span className={`text-sm font-medium leading-tight ${isDone || isSkipped ? 'text-slate-400 line-through' : isOngoing ? 'text-amber-100' : 'text-white'}`}>
          {data.label}
        </span>
      </div>
      {data.confidence !== undefined && data.confidence < 1 && (
        <div className="mt-1.5 ml-7">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${data.confidence >= 0.8 ? 'bg-emerald-500/15 text-emerald-400' : data.confidence >= 0.5 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
            {Math.round(data.confidence * 100)}% match
          </span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
    </div>
  )
}

const nodeTypes = { module: ModuleNode, topic: TopicNode }

// ─── Main Component ───
export default function RoadmapViewer() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const subjectIndex = parseInt(searchParams.get('subjectIndex') || '0', 10)

  const { user } = useStore()
  const navigate = useNavigate()

  const [roadmapData, setRoadmapData] = useState<UserRoadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progressState, setProgressState] = useState<Record<string, string>>({})
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !id) { setIsLoading(false); return }
      try {
        const res = await getUserRoadmaps(user.id)
        const found = res.data.find((r) => r.id === id)
        if (found) {
          setRoadmapData(found)
          setProgressState(found.progress_state || {})
        }
      } catch (err) { console.error(err) }
      finally { setIsLoading(false) }
    }
    loadData()
  }, [user?.id, id])

  // Build graph from roadmap data
  const roadmap = useMemo(() => {
    if (!roadmapData) return null
    let raw = roadmapData.customized_syllabus
    if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { return null } }

    let subjectsArray: any[] = []
    if (Array.isArray(raw)) {
      subjectsArray = raw.length > 0 && raw[0].topics ? [{ subject_name: 'Roadmap', modules: raw }] : raw
    } else if (raw?.modules) {
      subjectsArray = [raw]
    } else {
      return null
    }
    return subjectsArray[subjectIndex] || subjectsArray[0]
  }, [roadmapData, subjectIndex])

  const handleSelectTopic = useCallback((topic: any) => {
    setSelectedTopic(topic)
  }, [])

  // Build nodes & edges whenever roadmap or progress changes
  useEffect(() => {
    if (!roadmap?.modules) return

    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    roadmap.modules.forEach((mod: any, mi: number) => {
      const moduleId = `mod-${mi}`
      newNodes.push({
        id: moduleId,
        type: 'module',
        position: { x: 0, y: 0 },
        data: {
          label: mod.title,
          moduleNumber: mod.module_number || `Module ${mi + 1}`,
          topicCount: mod.topics?.length || 0,
          width: 260,
          height: 80,
        },
      })

      // Connect modules in sequence
      if (mi > 0) {
        newEdges.push({
          id: `mod-edge-${mi - 1}-${mi}`,
          source: `mod-${mi - 1}`,
          target: moduleId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.4 },
        })
      }

      // Topics under this module
      ; (mod.topics || []).forEach((topic: any, ti: number) => {
        const topicId = `topic-${mi}-${ti}`
        const title = topic.title || topic.syllabus_text || topic
        const status = progressState[typeof title === 'string' ? title : ''] || 'pending'

        newNodes.push({
          id: topicId,
          type: 'topic',
          position: { x: 0, y: 0 },
          data: {
            label: typeof title === 'string' ? title : JSON.stringify(title),
            status,
            topic: topic,
            confidence: topic.confidence,
            onSelect: handleSelectTopic,
            width: 240,
            height: 55,
          },
        })

        newEdges.push({
          id: `edge-${moduleId}-${topicId}`,
          source: moduleId,
          target: topicId,
          type: 'smoothstep',
          style: {
            stroke: status === 'done' ? '#10b981' : status === 'ongoing' ? '#f59e0b' : '#334155',
            strokeWidth: 1.5,
          },
        })
      })
    })

    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges)
    setNodes(layouted)
    setEdges(layoutedEdges)
  }, [roadmap, progressState, handleSelectTopic])

  const handleStatusChange = async (topicTitle: string, newStatus: string) => {
    if (!user?.id || !roadmapData?.id) return
    setProgressState((prev) => ({ ...prev, [topicTitle]: newStatus }))
    try {
      await updateTopicProgress(user.id, roadmapData.id, { topic_title: topicTitle, status: newStatus })
    } catch (err) { console.error('Failed to update status', err) }
  }

  // ── Loading / Empty States ──
  if (isLoading) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center z-10 relative">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center z-10 relative">
        <div className="text-center glass-panel p-10 rounded-3xl border border-white/10 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-3">Roadmap Not Found</h2>
          <p className="text-slate-400 mb-6">We couldn't find this study plan in your account.</p>
          <button onClick={() => navigate('/roadmaps')} className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all cursor-pointer">
            Back to Roadmaps
          </button>
        </div>
      </div>
    )
  }

  const totalTopics = roadmap.modules?.reduce((acc: number, m: any) => acc + (m.topics?.length || 0), 0) || 0
  const completedCount = Object.values(progressState).filter((s) => s === 'done').length
  const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0

  return (
    <div className="w-full h-screen relative flex">

      {/* ── React Flow Canvas ── */}
      <div className="flex-1 relative">
        {/* Header overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="glass-panel px-5 py-3 rounded-2xl border border-white/10 pointer-events-auto">
            <h1 className="text-lg font-bold text-white">{roadmap.subject_name || 'Roadmap'}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-indigo-400 font-bold">{progress}%</span>
              <span className="text-xs text-slate-500">{completedCount}/{totalTopics} topics</span>
            </div>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="!bg-slate-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
          <Controls
            position="bottom-left"
            className="!bg-slate-900/80 !border-white/10 !rounded-xl !shadow-xl [&>button]:!bg-slate-800 [&>button]:!border-white/10 [&>button]:!text-white [&>button:hover]:!bg-slate-700"
          />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            className="!bg-slate-900/80 !border-white/10 !rounded-xl"
            nodeColor={(n) => n.type === 'module' ? '#6366f1' : '#334155'}
          />
        </ReactFlow>
      </div>

      {/* ── Topic Detail Sidebar ── */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full md:w-96 bg-slate-950/95 backdrop-blur-3xl border-l border-white/10 fixed inset-y-0 right-0 z-50 flex flex-col shadow-2xl"
          >
            {/* Sidebar Header — fixed at top */}
            <div className="flex-shrink-0 p-6 pb-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 block">Topic Details</span>
                <h3 className="text-xl font-bold text-white leading-tight pr-4">{selectedTopic.title || selectedTopic.syllabus_text}</h3>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
              {selectedTopic.description && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedTopic.description}</p>
                </div>
              )}

              <div className="mb-6 relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
                <div className="relative w-full">
                  <select
                    value={progressState[selectedTopic.title || selectedTopic.syllabus_text] || 'pending'}
                    onChange={(e) => handleStatusChange(selectedTopic.title || selectedTopic.syllabus_text, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="pending" className="bg-slate-900">Pending</option>
                    <option value="ongoing" className="bg-slate-900">Ongoing</option>
                    <option value="skipped" className="bg-slate-900">Skipped</option>
                    <option value="done" className="bg-slate-900">Done</option>
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-purple-400" /> Recommended Video
                  </h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 cursor-pointer transition-colors group">
                    <p className="text-sm font-medium group-hover:text-purple-300 transition-colors line-clamp-1">Crash Course: {selectedTopic.title || selectedTopic.syllabus_text}</p>
                    <span className="text-xs text-slate-500 mt-1 block">YouTube • ~12 mins</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" /> Reading Material
                  </h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-colors group">
                    <p className="text-sm font-medium group-hover:text-emerald-300 transition-colors">Core Concepts Guide</p>
                    <span className="text-xs text-slate-500 mt-1 block">Article • 5 min read</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Button — always pinned at bottom */}
            <div className="flex-shrink-0 p-6 pt-4 border-t border-white/10 bg-slate-950/95">
              <button
                onClick={() => navigate(`/quiz/session?topic=${encodeURIComponent(selectedTopic.title || selectedTopic.syllabus_text)}&plan_id=${roadmapData!.id}&subject_id=${encodeURIComponent(roadmap.subject_name || '')}`)}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate Topic Quiz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Tutor Bubble */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center text-white z-40 cursor-pointer"
      >
        <Bot className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
