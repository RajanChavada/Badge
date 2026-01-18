/**
 * Knowledge Graph Manager
 * Builds and manages the 3D knowledge graph from user interactions and booth data
 */

export class KnowledgeGraphManager {
  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
    this.nodeCounter = 0
  }

  /**
   * Create a node from booth data
   */
  addBoothNode(booth) {
    const nodeId = `booth-${booth.id}`
    
    if (!this.nodes.has(nodeId)) {
      this.nodes.set(nodeId, {
        id: nodeId,
        label: booth.name,
        type: 'booth',
        color: booth.color || 0x4285f4,
        data: {
          companyName: booth.companyName,
          description: booth.description,
          talkingPoints: booth.talkingPoints,
          tags: booth.tags,
          keyPeople: booth.keyPeople,
          visitCount: 0,
          lastVisit: null,
        },
      })
    }
    
    return nodeId
  }

  /**
   * Create a node from user profile
   */
  addUserNode(user) {
    const nodeId = `user-${user.id}`
    
    if (!this.nodes.has(nodeId)) {
      this.nodes.set(nodeId, {
        id: nodeId,
        label: user.name,
        type: 'user',
        color: 0x00ff88,
        data: {
          email: user.email,
          skills: user.identity?.skills || [],
          interests: user.identity?.interests || [],
          goals: user.identity?.goals || [],
        },
      })
    }
    
    return nodeId
  }

  /**
   * Create a node from a skill/tag
   */
  addConceptNode(concept, type = 'skill', color = 0xff6b9d) {
    const nodeId = `concept-${type}-${concept}`
    
    if (!this.nodes.has(nodeId)) {
      this.nodes.set(nodeId, {
        id: nodeId,
        label: concept,
        type: `concept-${type}`,
        color: color,
        data: {
          concept: concept,
          conceptType: type,
          connectedCount: 0,
        },
      })
    }
    
    return nodeId
  }

  /**
   * Create an edge between two nodes
   */
  addEdge(sourceId, targetId, relationship = 'connected', color = 0x888888) {
    const edgeId = `${sourceId}--${targetId}`
    
    if (!this.edges.has(edgeId)) {
      this.edges.set(edgeId, {
        id: edgeId,
        source: sourceId,
        target: targetId,
        relationship: relationship,
        color: color,
        strength: 1,
      })
    }
    
    return edgeId
  }

  /**
   * Connect user to booth (visit)
   */
  connectUserToBoothNode(userId, boothId) {
    const userNodeId = `user-${userId}`
    const boothNodeId = `booth-${boothId}`
    
    // Ensure nodes exist
    if (!this.nodes.has(userNodeId) || !this.nodes.has(boothNodeId)) {
      return null
    }
    
    // Add "visited" edge
    this.addEdge(userNodeId, boothNodeId, 'visited', 0x4285f4)
    
    // Update booth visit count
    const boothNode = this.nodes.get(boothNodeId)
    boothNode.data.visitCount++
    boothNode.data.lastVisit = new Date().toISOString()
    
    return boothNodeId
  }

  /**
   * Connect user skills to booth tags
   */
  connectSkillsToBooth(userId, boothId, userSkills = [], boothTags = []) {
    const matches = []
    
    userSkills.forEach((skill) => {
      if (boothTags.includes(skill)) {
        const skillNodeId = this.addConceptNode(skill, 'skill', 0xffa500)
        const userNodeId = `user-${userId}`
        const boothNodeId = `booth-${boothId}`
        
        // Connect user -> skill
        this.addEdge(userNodeId, skillNodeId, 'has-skill', 0xffa500)
        
        // Connect skill -> booth
        this.addEdge(skillNodeId, boothNodeId, 'relevant-to', 0xffa500)
        
        matches.push({
          skill,
          skillNodeId,
          strength: 'high',
        })
      }
    })
    
    return matches
  }

  /**
   * Connect interests to booths
   */
  connectInterestsToBooth(userId, boothId, userInterests = [], boothTags = []) {
    const matches = []
    
    userInterests.forEach((interest) => {
      if (boothTags.includes(interest)) {
        const interestNodeId = this.addConceptNode(interest, 'interest', 0xff00ff)
        const userNodeId = `user-${userId}`
        const boothNodeId = `booth-${boothId}`
        
        // Connect user -> interest
        this.addEdge(userNodeId, interestNodeId, 'interested-in', 0xff00ff)
        
        // Connect interest -> booth
        this.addEdge(interestNodeId, boothNodeId, 'matches', 0xff00ff)
        
        matches.push({
          interest,
          interestNodeId,
          strength: 'high',
        })
      }
    })
    
    return matches
  }

  /**
   * Get all nodes as array
   */
  getNodes() {
    return Array.from(this.nodes.values())
  }

  /**
   * Get all edges as array
   */
  getEdges() {
    return Array.from(this.edges.values())
  }

  /**
   * Get node by ID
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId)
  }

  /**
   * Get connected nodes
   */
  getConnectedNodes(nodeId) {
    const connected = []
    
    this.edges.forEach((edge) => {
      if (edge.source === nodeId) {
        connected.push(this.nodes.get(edge.target))
      } else if (edge.target === nodeId) {
        connected.push(this.nodes.get(edge.source))
      }
    })
    
    return connected
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes.clear()
    this.edges.clear()
    this.nodeCounter = 0
  }
}

export const graphManager = new KnowledgeGraphManager()
