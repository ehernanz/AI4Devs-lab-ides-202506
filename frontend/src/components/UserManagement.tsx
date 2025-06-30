import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

interface User {
  id: number;
  username: string;
  role: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = { username: '', password: '', repeatPassword: '', role: 'user' };

type FormMode = 'create' | 'edit';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const token = localStorage.getItem('token');
  const userLogged = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3010/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setError('No se pudieron cargar los usuarios');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const openCreateModal = () => {
    setForm({ ...emptyForm });
    setFormMode('create');
    setSelectedUserId(null);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setForm({ username: user.username, password: '', repeatPassword: '', role: user.role });
    setFormMode('edit');
    setSelectedUserId(user.id);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!form.username || (formMode === 'create' && !form.password)) {
      setFormError('Usuario y contraseña son obligatorios');
      return;
    }
    if (form.password && form.password !== form.repeatPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }
    if (!['admin', 'user'].includes(form.role)) {
      setFormError('Rol no válido');
      return;
    }
    try {
      const method = formMode === 'create' ? 'POST' : 'PUT';
      const url = formMode === 'create'
        ? 'http://localhost:3010/users'
        : `http://localhost:3010/users/${selectedUserId}`;
      const body: any = {
        username: form.username,
        role: form.role
      };
      if (form.password) body.password = form.password;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setFormSuccess(formMode === 'create' ? 'Usuario creado' : 'Usuario actualizado');
        fetchUsers();
        setTimeout(() => setShowModal(false), 1200);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Error al guardar el usuario');
      }
    } catch {
      setFormError('Error de conexión');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === userLogged.id) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar el usuario "${user.username}"?`)) return;
    try {
      const res = await fetch(`http://localhost:3010/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el usuario');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  return (
    <div className="user-management-page">
      <div className="user-management-container">
        <button className="btn btn-secondary btn-back" onClick={() => navigate('/')}>⟵ Volver</button>
        <h1 className="user-management-title">Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Crear usuario
        </button>
        {loading ? (
          <div className="user-management-loading">Cargando usuarios...</div>
        ) : error ? (
          <div className="user-management-error">{error}</div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Último acceso</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(user)}>
                      Editar
                    </button>
                    {user.id !== userLogged.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{formMode === 'create' ? 'Crear usuario' : 'Editar usuario'}</h2>
            <form onSubmit={handleFormSubmit} className="user-form">
              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleFormChange}
                  required
                  disabled={formMode === 'edit'}
                />
              </div>
              <div className="form-group">
                <label>Contraseña {formMode === 'edit' ? '(dejar en blanco para no cambiar)' : ''}</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Repetir contraseña</label>
                <input
                  type="password"
                  name="repeatPassword"
                  value={form.repeatPassword}
                  onChange={handleFormChange}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select name="role" value={form.role} onChange={handleFormChange} required>
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">{formSuccess}</div>}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {formMode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 