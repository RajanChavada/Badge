import React, { useEffect, useMemo, useState } from 'react'
import { useAction } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../convex/_generated/api'
import './SimilarityRanking.css'

const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i += 1) {
    const x = a[i]
    const y = b[i]
    if (typeof x !== 'number' || typeof y !== 'number') return null
    dot += x * y
    normA += x * x
    normB += y * y
  }

  if (normA === 0 || normB === 0) return null
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export default function SimilarityRanking() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const getProfileVectors = useAction(api.users.getProfileVectors)
  const { user } = useUser()

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getProfileVectors()
        if (result.success) {
          setProfiles(result.data)
        } else {
          setError('Unable to load vectors')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [getProfileVectors])

  const currentProfile = useMemo(() => {
    if (!user) return null
    return profiles.find((p) => p.clerkId === user.id) || null
  }, [profiles, user])

  const rankings = useMemo(() => {
    if (!currentProfile || !Array.isArray(currentProfile.vector) || currentProfile.vector.length === 0) return []

    return profiles
      .filter(
        (p) =>
          p.clerkId !== currentProfile.clerkId &&
          Array.isArray(p.vector) &&
          p.vector.length === currentProfile.vector.length
      )
      .map((p) => ({
        ...p,
        similarity: cosineSimilarity(currentProfile.vector, p.vector),
      }))
      .filter((p) => p.similarity !== null)
      .sort((a, b) => b.similarity - a.similarity)
  }, [profiles, currentProfile])

  const renderContent = () => {
    if (loading) {
      return <div className="card">Loading vectors...</div>
    }

    if (error) {
      return <div className="card error">{error}</div>
    }

    if (!currentProfile) {
      return (
        <div className="card warning">
          We could not find your profile vector. Please generate it first, then refresh this page.
        </div>
      )
    }

    if (rankings.length === 0) {
      return <div className="card warning">No comparable vectors found yet.</div>
    }

    const topMatch = rankings[0]

    return (
      <div className="card">
        <div className="summary">
          <div>
            <strong>Your profile:</strong> {currentProfile.name || 'Unknown'}
          </div>
          <div>
            <strong>Compared against:</strong> {rankings.length} user{rankings.length === 1 ? '' : 's'}
          </div>
          <div>
            <strong>Top match:</strong> {topMatch.name || 'Unknown'} ({(topMatch.similarity * 100).toFixed(2)}%)
          </div>
        </div>

        <table className="similarity-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Clerk ID</th>
              <th>Cosine similarity</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((p, idx) => (
              <tr key={p.clerkId}>
                <td>{idx + 1}</td>
                <td>{p.name || 'Unknown'}</td>
                <td className="muted">{p.clerkId}</td>
                <td>{(p.similarity * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="similarity-page">
      <div className="header">
        <div>
          <h1>Similarity Ranking</h1>
          <p>Cosine similarity between your profile vector and everyone else.</p>
        </div>
        <div className="pill">Live data</div>
      </div>
      {renderContent()}
    </div>
  )
}
