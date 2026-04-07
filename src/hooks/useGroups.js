import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  doc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for managing groups/channels
 * @param {string} userId - Current user ID
 * @returns {Object} - { groups, loading, createGroup, joinGroup, leaveGroup, updateGroup }
 */
export function useGroups(userId) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's groups
  useEffect(() => {
    if (!userId) {
      console.log('useGroups: No userId provided');
      return;
    }

    console.log('useGroups: Setting up listener for userId:', userId);
    setLoading(true);
    
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId),
      orderBy('lastActivity', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('useGroups: Snapshot received, docs count:', snapshot.docs.length);
      
      const groupsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setGroups(groupsList);
      setLoading(false);
    }, (err) => {
      console.error('Groups snapshot error:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  // Create a new group
  const createGroup = useCallback(async (groupData) => {
    if (!userId) throw new Error('User ID required');

    try {
      const newGroup = {
        name: groupData.name.slice(0, 100),
        description: (groupData.description || '').slice(0, 500),
        type: groupData.type || 'group', // 'group' or 'channel'
        isPublic: groupData.isPublic || false,
        creator: userId,
        members: [userId],
        admins: [userId],
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        memberCount: 1,
        messageCount: 0
      };

      const docRef = await addDoc(collection(db, 'groups'), newGroup);
      console.log('Group created with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Failed to create group:', err);
      throw err;
    }
  }, [userId]);

  // Join a group
  const joinGroup = useCallback(async (groupId) => {
    if (!userId) throw new Error('User ID required');

    try {
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion(userId),
        memberCount: groups.find(g => g.id === groupId)?.memberCount + 1 || 1
      });
      console.log('Joined group:', groupId);
    } catch (err) {
      console.error('Failed to join group:', err);
      throw err;
    }
  }, [userId, groups]);

  // Leave a group
  const leaveGroup = useCallback(async (groupId) => {
    if (!userId) throw new Error('User ID required');

    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');

      // If user is the only member, delete the group
      if (group.memberCount === 1) {
        await deleteDoc(doc(db, 'groups', groupId));
        console.log('Deleted empty group:', groupId);
      } else {
        await updateDoc(doc(db, 'groups', groupId), {
          members: arrayRemove(userId),
          admins: arrayRemove(userId),
          memberCount: group.memberCount - 1
        });
        console.log('Left group:', groupId);
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
      throw err;
    }
  }, [userId, groups]);

  // Update group details
  const updateGroup = useCallback(async (groupId, updates) => {
    if (!userId) throw new Error('User ID required');

    try {
      const allowedUpdates = {};
      if (updates.name) allowedUpdates.name = updates.name.slice(0, 100);
      if (updates.description !== undefined) allowedUpdates.description = updates.description.slice(0, 500);
      if (updates.isPublic !== undefined) allowedUpdates.isPublic = updates.isPublic;

      await updateDoc(doc(db, 'groups', groupId), allowedUpdates);
      console.log('Updated group:', groupId);
    } catch (err) {
      console.error('Failed to update group:', err);
      throw err;
    }
  }, [userId]);

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    updateGroup
  };
}
