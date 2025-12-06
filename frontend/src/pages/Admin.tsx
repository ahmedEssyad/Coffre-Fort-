import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  X,
  CheckCircle2,
  Mail,
  ShieldAlert,
  Circle,
  Trash2,
  Edit3
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { adminApi, User, accessApi, TemporaryAccess } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { showToast, extractErrorMessage, SuccessMessages } from '../utils/toast';
import '../theme.css';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [accesses, setAccesses] = useState<TemporaryAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);

  // Check if user has admin role
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      setError('Accès refusé : Privilèges administrateur requis');
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    // Don't load data if user is not admin
    if (!user || user.role !== 'ADMIN') {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Load users first
      const userList = await adminApi.getUsers();
      setUsers(userList);

      // Try to load accesses, but don't fail if it errors
      try {
        const accessList = await accessApi.getAllAccesses();
        console.log('Loaded accesses:', accessList);
        setAccesses(accessList);
      } catch (err) {
        console.warn('Failed to load accesses:', err);
        setAccesses([]); // Set empty array if fails
      }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      if (err.response?.status === 403) {
        setError('Accès refusé : Privilèges administrateur requis');
      } else {
        setError(errorMessage);
      }
      showToast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleDeleteUser = async (userToDelete: User) => {
    // Prevent deleting yourself
    if (user && userToDelete.id === user.id) {
      showToast.warning('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    // Confirm deletion
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${userToDelete.email} ?\n\nCette action ne peut pas être annulée.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await adminApi.deleteUser(userToDelete.id);
      showToast.success(SuccessMessages.USER_DELETED);
      // Reload users list
      await loadData();
    } catch (err: any) {
      console.error('Delete user failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    }
  };

  const getUserAccessStatus = (userId: string) => {
    // Safety check: return 'none' if accesses not loaded or not an array
    if (!accesses || !Array.isArray(accesses) || accesses.length === 0) {
      return { status: 'none', access: null };
    }

    const now = new Date();
    const userAccesses = accesses.filter(a => a.userId === userId && a.isActive);
    console.log(`Checking access for user ${userId}:`, userAccesses);

    if (userAccesses.length === 0) {
      return { status: 'none', access: null };
    }

    const activeAccess = userAccesses.find(a =>
      new Date(a.startDate) <= now && new Date(a.endDate) >= now
    );

    if (activeAccess) {
      return { status: 'active', access: activeAccess };
    }

    const futureAccess = userAccesses.find(a => new Date(a.startDate) > now);
    if (futureAccess) {
      return { status: 'scheduled', access: futureAccess };
    }

    const expiredAccess = userAccesses.find(a => new Date(a.endDate) < now);
    if (expiredAccess) {
      return { status: 'expired', access: expiredAccess };
    }

    return { status: 'none', access: null };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="admin-page">
        <div className="page-header">
          <h1>Gestion des Utilisateurs</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowInvite(true)}
          >
            <UserPlus size={18} />
            Inviter un Utilisateur
          </button>
        </div>

        {error ? (
          <div className="error-container">
            <div className="error-message-large">
              <div className="error-icon">
                <ShieldAlert size={32} />
              </div>
              <h2>{error}</h2>
              <p>Vous avez besoin de privilèges administrateur pour accéder à cette page.</p>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Aller au Tableau de Bord
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="admin-skeleton">
            <div className="skeleton-header"></div>
            <div className="skeleton-table">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Accès</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Aucun utilisateur pour le moment. Invitez votre premier utilisateur !
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const { status, access } = getUserAccessStatus(user.id);
                    return (
                      <tr key={user.id}>
                        <td className="user-email" data-label="Email">{user.email}</td>
                        <td className="user-name" data-label="Nom">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || user.lastName || '-'}
                        </td>
                        <td className="user-role" data-label="Rôle">
                          <span className={`role-badge role-${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                          {user.authMethod === 'SSO' && (
                            <span className="auth-badge auth-sso">
                              SSO
                            </span>
                          )}
                        </td>
                        <td className="user-status" data-label="Statut">
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="user-access" data-label="Accès">
                          <span className={`access-badge access-${status}`}>
                            {status === 'active' && (
                              <>
                                <Circle size={10} fill="currentColor" />
                                Actif
                              </>
                            )}
                            {status === 'scheduled' && (
                              <>
                                <Circle size={10} fill="currentColor" />
                                Programmé
                              </>
                            )}
                            {status === 'expired' && (
                              <>
                                <Circle size={10} fill="currentColor" />
                                Expiré
                              </>
                            )}
                            {status === 'none' && (
                              <>
                                <Circle size={10} />
                                Aucun Accès
                              </>
                            )}
                          </span>
                          {access && (
                            <div className="access-dates">
                              {formatDate(access.startDate)} - {formatDate(access.endDate)}
                            </div>
                          )}
                        </td>
                        <td className="user-actions" data-label="Actions">
                          <div className="action-buttons">
                            <button
                              className="btn btn-small btn-secondary"
                              onClick={() => setSelectedUser(user)}
                            >
                              Gérer l'Accès
                            </button>
                            <button
                              className="btn btn-small btn-secondary"
                              onClick={() => setRoleChangeUser(user)}
                              title="Changer le rôle"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteUser(user)}
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {showInvite && (
          <InviteUserModal
            onClose={() => setShowInvite(false)}
            onInviteSuccess={() => {
              setShowInvite(false);
              loadData();
            }}
          />
        )}

        {selectedUser && (
          <AccessManagementModal
            user={selectedUser}
            accesses={Array.isArray(accesses) ? accesses.filter(a => a.userId === selectedUser.id) : []}
            onClose={() => setSelectedUser(null)}
            onSuccess={() => {
              setSelectedUser(null);
              loadData();
            }}
          />
        )}

        {roleChangeUser && (
          <ChangeRoleModal
            user={roleChangeUser}
            currentUser={user}
            onClose={() => setRoleChangeUser(null)}
            onSuccess={() => {
              setRoleChangeUser(null);
              loadData();
            }}
          />
        )}
      </div>

    </Layout>
  );
};

// Invite User Modal Component
interface InviteUserModalProps {
  onClose: () => void;
  onInviteSuccess: () => void;
}

const InviteUserModal = ({ onClose, onInviteSuccess }: InviteUserModalProps) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'USER' | 'CONSULTANT' | 'ADMIN'>('USER');
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    if (!email) {
      showToast.warning('Veuillez entrer une adresse email');
      return;
    }

    try {
      setInviting(true);
      await adminApi.inviteUser(email, firstName || undefined, lastName || undefined, role);
      setSuccess(true);
      showToast.success(SuccessMessages.INVITATION_SENT);
      setTimeout(() => {
        onInviteSuccess();
      }, 2000);
    } catch (err) {
      console.error('Invite failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Inviter un Utilisateur</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="modal-body">
            <div className="success-message">
              <div className="success-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3>Invitation envoyée !</h3>
              <p>Un email a été envoyé à {email} avec les instructions pour définir son mot de passe.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="form-group">
                <label>Adresse Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utilisateur@exemple.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Optionnel"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Optionnel"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Rôle *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'USER' | 'CONSULTANT' | 'ADMIN')}
                  className="form-input"
                  required
                >
                  <option value="USER">Utilisateur Standard (Accès Temporaire)</option>
                  <option value="CONSULTANT">Consultant (Accès Permanent)</option>
                  <option value="ADMIN">Administrateur Système</option>
                </select>
                <small className="text-muted">
                  <strong>Utilisateur:</strong> Accès aux documents uniquement pendant les fenêtres définies<br/>
                  <strong>Consultant:</strong> Accès permanent aux documents, sans limite de temps<br/>
                  <strong>Administrateur:</strong> Contrôle total du système et gestion des utilisateurs
                </small>
              </div>

              <div className="info-box">
                <Mail size={16} className="info-icon" />
                <p>
                  L'utilisateur recevra un email avec un lien pour définir son mot de passe
                  et accéder au système.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={inviting || !email}
              >
                {inviting ? 'Envoi...' : 'Envoyer l\'Invitation'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

// Access Management Modal Component
interface AccessManagementModalProps {
  user: User;
  accesses: TemporaryAccess[];
  onClose: () => void;
  onSuccess: () => void;
}

const AccessManagementModal = ({
  user,
  accesses,
  onClose,
  onSuccess,
}: AccessManagementModalProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreateAccess = async () => {
    if (!startDate || !endDate) {
      showToast.warning('Veuillez sélectionner les dates de début et de fin');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      showToast.warning('La date de fin doit être après la date de début');
      return;
    }

    try {
      setSaving(true);
      await accessApi.createAccess(user.id, startDate, endDate);
      showToast.success(SuccessMessages.ACCESS_CREATED);
      onSuccess();
    } catch (err) {
      console.error('Failed to create access:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccess = async (accessId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet accès ?')) {
      return;
    }

    try {
      await accessApi.deleteAccess(accessId);
      showToast.success(SuccessMessages.ACCESS_DELETED);
      onSuccess();
    } catch (err) {
      console.error('Failed to delete access:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content access-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gérer l'Accès pour {user.email}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="section">
            <h3>Créer un Nouvel Accès</h3>
            <div className="access-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date de Début</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Date de Fin</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCreateAccess}
                disabled={saving || !startDate || !endDate}
              >
                {saving ? 'Création...' : 'Créer l\'Accès'}
              </button>
            </div>
          </div>

          <div className="section">
            <h3>Fenêtres d'Accès Existantes</h3>
            {accesses.length === 0 ? (
              <div className="empty-state-small">
                Aucune fenêtre d'accès configurée pour cet utilisateur.
              </div>
            ) : (
              <div className="access-list">
                {accesses.map((access) => {
                  const now = new Date();
                  const start = new Date(access.startDate);
                  const end = new Date(access.endDate);
                  const isActive = access.isActive && start <= now && end >= now;
                  const isScheduled = access.isActive && start > now;
                  const isExpired = end < now;

                  return (
                    <div key={access.id} className="access-item">
                      <div className="access-item-info">
                        <div className="access-item-status">
                          <span className={`access-badge access-${isActive ? 'active' : isScheduled ? 'scheduled' : 'expired'}`}>
                            {isActive && (
                              <>
                                <Circle size={10} fill="currentColor" />
                                Actif
                              </>
                            )}
                            {isScheduled && (
                              <>
                                <Circle size={10} fill="currentColor" />
                                Programmé
                              </>
                            )}
                            {isExpired && (
                              <>
                                <Circle size={10} fill="currentColor" />
                                Expiré
                              </>
                            )}
                            {!access.isActive && (
                              <>
                                <Circle size={10} />
                                Inactif
                              </>
                            )}
                          </span>
                        </div>
                        <div className="access-item-dates">
                          <strong>De :</strong> {formatDateTime(access.startDate)}<br />
                          <strong>À :</strong> {formatDateTime(access.endDate)}
                        </div>
                      </div>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteAccess(access.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};

// Change Role Modal Component
interface ChangeRoleModalProps {
  user: User;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ChangeRoleModal = ({ user, currentUser, onClose, onSuccess }: ChangeRoleModalProps) => {
  const [newRole, setNewRole] = useState<'USER' | 'CONSULTANT' | 'ADMIN'>(user.role as 'USER' | 'CONSULTANT' | 'ADMIN');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChangeRole = async () => {
    // Prevent changing own role from ADMIN
    if (currentUser && user.id === currentUser.id && user.role === 'ADMIN' && newRole !== 'ADMIN') {
      showToast.warning('Vous ne pouvez pas vous retirer le rôle ADMIN');
      return;
    }

    // If no change, just close
    if (newRole === user.role) {
      onClose();
      return;
    }

    try {
      setSaving(true);
      await adminApi.updateUserRole(user.id, newRole);
      setSuccess(true);
      showToast.success(SuccessMessages.ROLE_UPDATED);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Role change failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Changer le Rôle de l'Utilisateur</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="modal-body">
            <div className="success-message">
              <div className="success-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3>Rôle mis à jour !</h3>
              <p>Le rôle pour {user.email} a été changé en {newRole}.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="user-info-box">
                <p><strong>Utilisateur :</strong> {user.email}</p>
                <p><strong>Rôle Actuel :</strong> <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span></p>
              </div>

              <div className="form-group">
                <label>Nouveau Rôle *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'USER' | 'CONSULTANT' | 'ADMIN')}
                  className="form-input"
                  required
                >
                  <option value="USER">Utilisateur Standard (Accès Temporaire)</option>
                  <option value="CONSULTANT">Consultant (Accès Permanent)</option>
                  <option value="ADMIN">Administrateur Système</option>
                </select>
                <small className="text-muted">
                  <strong>Utilisateur:</strong> Accès aux documents uniquement pendant les fenêtres définies<br/>
                  <strong>Consultant:</strong> Accès permanent aux documents, sans limite de temps<br/>
                  <strong>Administrateur:</strong> Contrôle total du système et gestion des utilisateurs
                </small>
              </div>

              {user.role === 'ADMIN' && newRole !== 'ADMIN' && (
                <div className="warning-box">
                  <ShieldAlert size={16} className="warning-icon" />
                  <p>
                    <strong>Attention :</strong> Vous êtes sur le point de rétrograder un administrateur.
                    Cela supprimera sa capacité à gérer les utilisateurs et les paramètres du système.
                  </p>
                </div>
              )}

              {currentUser && user.id === currentUser.id && (
                <div className="info-box">
                  <Mail size={16} className="info-icon" />
                  <p>
                    <strong>Note :</strong> Vous modifiez votre propre rôle.
                    Vous ne pouvez pas vous retirer le rôle ADMIN.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleChangeRole}
                disabled={saving || newRole === user.role}
              >
                {saving ? 'Mise à jour...' : 'Mettre à Jour le Rôle'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
