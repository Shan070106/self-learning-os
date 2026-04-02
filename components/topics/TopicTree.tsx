"use client"

import { useState, useEffect } from "react"

interface Topic {
  id: string
  title: string
  description: string | null
  subjectId: string
  parentId: string | null
  createdAt: string
}

interface TopicTreeProps {
  subjectId: string
}

export default function TopicTree({ subjectId }: TopicTreeProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState<string>("")

  useEffect(() => {
    fetchTopics()
  }, [subjectId])

  const fetchTopics = async () => {
    try {
      const res = await fetch(`/api/topics?subjectId=${subjectId}`)
      if (res.ok) {
        const data = await res.json()
        setTopics(data)
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          description, 
          subjectId, 
          parentId: parentId || null 
        }),
      })
      
      if (res.ok) {
        const newTopic = await res.json()
        setTopics([...topics, newTopic])
        setTitle("")
        setDescription("")
        setParentId("")
        setIsAdding(false)
      }
    } catch (error) {
      console.error("Failed to create topic:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this topic and all its subtopics?")) return

    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        // Optimistic refresh
        fetchTopics()
      }
    } catch (error) {
      console.error("Failed to delete topic:", error)
    }
  }

  // Recursive component to render tree
  const TopicNode = ({ topic, level = 0 }: { topic: Topic, level?: number }) => {
    const children = topics.filter(t => t.parentId === topic.id)
    
    return (
      <div className="w-full">
        <div 
          className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          style={{ paddingLeft: `${Math.max(0.5, level * 2)}rem` }}
        >
          <div className="flex items-center gap-3">
            {level > 0 && (
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{topic.title}</h4>
              {topic.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{topic.description}</p>
              )}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pr-2">
            <button
              onClick={() => {
                setParentId(topic.id)
                setIsAdding(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
              title="Add Subtopic"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(topic.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Delete Topic"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {children.length > 0 && (
          <div className="w-full">
            {children.map(child => (
              <TopicNode key={child.id} topic={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const rootTopics = topics.filter(t => t.parentId === null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Topics</h2>
        <button
          onClick={() => {
            setParentId("")
            setIsAdding(!isAdding)
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          {isAdding ? "Cancel" : "Add Topic"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topic Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g., Introduction to React"
              required
            />
          </div>
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parent Topic (Optional)
            </label>
            <select
              id="parentId"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">No parent (Root Topic)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors"
            >
              Save Topic
            </button>
          </div>
        </form>
      )}

      {topics.length === 0 && !isAdding ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No topics yet</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Get started by creating a new topic.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 overflow-hidden shadow-sm">
          {rootTopics.map(topic => (
            <TopicNode key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  )
}
