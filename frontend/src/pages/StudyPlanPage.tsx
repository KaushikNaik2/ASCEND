import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, GripVertical, Download } from 'lucide-react'
import { mockSyllabus } from '../lib/mockData'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function StudyPlanPage() {
  const [schedule, setSchedule] = useState<Record<string, any[]>>({
    'Monday': [mockSyllabus.modules[0].topics[0], mockSyllabus.modules[0].topics[1]],
    'Tuesday': [mockSyllabus.modules[0].topics[2]],
    'Wednesday': [mockSyllabus.modules[1].topics[0], mockSyllabus.modules[1].topics[1]],
    'Thursday': [mockSyllabus.modules[1].topics[2]],
    'Friday': [mockSyllabus.modules[2].topics[0]],
    'Saturday': [mockSyllabus.modules[2].topics[1], mockSyllabus.modules[2].topics[2]],
    'Sunday': [mockSyllabus.modules[2].topics[3]]
  })

  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null)

  const onDragStart = (e: React.DragEvent, item: any, day: string) => {
    setDraggedItem(item)
    setDraggedFrom(day)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = (e: React.DragEvent, targetDay: string) => {
    e.preventDefault()
    if (!draggedItem || !draggedFrom || draggedFrom === targetDay) return

    setSchedule(prev => {
      const newSchedule = { ...prev }
      // Remove from old day
      newSchedule[draggedFrom] = newSchedule[draggedFrom].filter(t => t.title !== draggedItem.title)
      // Add to new day
      newSchedule[targetDay] = [...newSchedule[targetDay], draggedItem]
      return newSchedule
    })
    setDraggedItem(null)
    setDraggedFrom(null)
  }

  return (
    <div className="w-full min-h-[85vh] p-6 max-w-7xl mx-auto relative z-10 flex flex-col mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-3">
              <CalendarIcon className="w-3.5 h-3.5" />
              Weekly Schedule
           </div>
           <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{mockSyllabus.subject_name}</h1>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-colors shadow-lg cursor-pointer">
          <Download className="w-4 h-4" />
          Export to Calendar <span className="text-xs text-slate-400 font-normal ml-1">(TODO)</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-8 snap-x p-2 scrollbar-hide">
        {DAYS.map((day) => (
          <div 
            key={day} 
            className="flex-1 min-w-[280px] snap-center flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, day)}
          >
            <div className="px-4 py-3 rounded-t-2xl border border-white/10 bg-slate-900 border-b-0 flex justify-between items-center">
              <h3 className="font-bold text-white">{day}</h3>
              <span className="text-xs font-semibold bg-white/10 px-2 py-1 rounded-md text-slate-300">
                {schedule[day]?.length || 0} topics
              </span>
            </div>
            
            <div className={`flex-1 min-h-[200px] p-3 border border-white/10 rounded-b-2xl bg-slate-900/50 backdrop-blur-sm transition-colors ${draggedFrom === day ? 'bg-slate-800/30' : ''}`}>
              <div className="space-y-3">
                {schedule[day]?.map((topic, j) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: j * 0.05 }}
                    key={topic.title}
                    draggable
                    onDragStart={(e) => onDragStart(e as any, topic, day)}
                    className="group bg-slate-800/80 hover:bg-slate-700 border border-white/5 hover:border-indigo-500/30 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-colors shadow-sm"
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-200 mb-2 leading-snug">{topic.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" /> {topic.estimated_hours}
                          </span>
                          <div className="w-1/2 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                             {/* Mock bar representing length of time visually */}
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: topic.estimated_hours === '4h' ? '80%' : topic.estimated_hours === '3.5h' ? '70%' : topic.estimated_hours === '3h' ? '60%' : '40%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {(!schedule[day] || schedule[day].length === 0) && (
                  <div className="h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-sm">
                    Drop topics here
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
