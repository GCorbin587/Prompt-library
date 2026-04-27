import React, { useEffect, useState } from 'react';
import {
  getCurrentSession,
  onAuthSessionChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from './lib/auth';
import {
  createPrompt,
  deletePrompt,
  fetchPrompts,
  updatePrompt,
} from './lib/prompts';

const emptyForm = {
  title: '',
  text: '',
  category: '',
};

const emptyAuthForm = {
  email: '',
  password: '',
};

function normalizePrompt(prompt) {
  return {
    ...prompt,
    usageCount: Number.isFinite(prompt.usageCount) ? prompt.usageCount : 0,
  };
}

function App() {
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authMode, setAuthMode] = useState('sign-in');
  const [session, setSession] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [prompts, setPrompts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    let ignoreSession = false;

    async function loadSession() {
      setIsCheckingSession(true);
      setAuthMessage('');

      try {
        const currentSession = await getCurrentSession();

        if (!ignoreSession) {
          setSession(currentSession);
        }
      } catch (error) {
        if (!ignoreSession) {
          setAuthMessage(error.message || 'Unable to check session.');
        }
      } finally {
        if (!ignoreSession) {
          setIsCheckingSession(false);
        }
      }
    }

    loadSession();

    const unsubscribe = onAuthSessionChange((nextSession) => {
      setSession(nextSession);
      setPrompts([]);
      setForm(emptyForm);
      setEditingId(null);
      setSelectedTag('All');
    });

    return () => {
      ignoreSession = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isCheckingSession) {
      return;
    }

    if (!session) {
      setPrompts([]);
      setIsLoading(false);
      return;
    }

    let ignoreLoad = false;

    async function loadPrompts() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const savedPrompts = await fetchPrompts();

        if (!ignoreLoad) {
          setPrompts(savedPrompts.map(normalizePrompt));
        }
      } catch (error) {
        if (!ignoreLoad) {
          setPrompts([]);
          setErrorMessage(error.message || 'Unable to load prompts.');
        }
      } finally {
        if (!ignoreLoad) {
          setIsLoading(false);
        }
      }
    }

    loadPrompts();

    return () => {
      ignoreLoad = true;
    };
  }, [isCheckingSession, session]);

  useEffect(() => {
    const categories = new Set(
      (Array.isArray(prompts) ? prompts : []).map((prompt) => prompt.category)
    );

    if (selectedTag !== 'All' && !categories.has(selectedTag)) {
      setSelectedTag('All');
    }
  }, [prompts, selectedTag]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleAuthChange(event) {
    const { name, value } = event.target;
    setAuthForm((currentAuthForm) => ({
      ...currentAuthForm,
      [name]: value,
    }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    const email = authForm.email.trim();
    const password = authForm.password;

    if (!email || !password) {
      return;
    }

    setIsAuthSubmitting(true);
    setAuthMessage('');

    try {
      const nextSession =
        authMode === 'sign-in'
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password);

      if (nextSession) {
        setSession(nextSession);
        setAuthForm(emptyAuthForm);
      } else {
        setAuthMessage('Check your email to confirm your account, then sign in.');
      }
    } catch (error) {
      setAuthMessage(error.message || 'Authentication failed.');
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function handleSignOut() {
    setErrorMessage('');
    setAuthMessage('');

    try {
      await signOut();
      setSession(null);
      setPrompts([]);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign out.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    const text = form.text.trim();
    const category = form.category.trim();

    if (!title || !text || !category) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    if (editingId) {
      try {
        const updatedPrompt = await updatePrompt(editingId, {
          title,
          text,
          category,
          usageCount:
            prompts.find((prompt) => prompt.id === editingId)?.usageCount ?? 0,
        });

        setPrompts((currentPrompts) =>
          currentPrompts.map((prompt) =>
            prompt.id === editingId ? normalizePrompt(updatedPrompt) : prompt
          )
        );
        setEditingId(null);
        setForm(emptyForm);
      } catch (error) {
        setErrorMessage(error.message || 'Unable to update prompt.');
      } finally {
        setIsSaving(false);
      }
    } else {
      try {
        const savedPrompt = await createPrompt({
          title,
          text,
          category,
          usageCount: 0,
        });

        setPrompts((currentPrompts) => [
          normalizePrompt(savedPrompt),
          ...currentPrompts,
        ]);
        setForm(emptyForm);
      } catch (error) {
        setErrorMessage(error.message || 'Unable to save prompt.');
      } finally {
        setIsSaving(false);
      }
    }
  }

  function handleEdit(prompt) {
    setForm({
      title: prompt.title,
      text: prompt.text,
      category: prompt.category,
    });
    setEditingId(prompt.id);
  }

  async function handleDelete(promptId) {
    setErrorMessage('');

    try {
      await deletePrompt(promptId);
      setPrompts((currentPrompts) =>
        currentPrompts.filter((prompt) => prompt.id !== promptId)
      );

      if (editingId === promptId) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete prompt.');
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleUse(prompt) {
    const nextUsageCount = (prompt.usageCount ?? 0) + 1;

    setPrompts((currentPrompts) =>
      currentPrompts.map((currentPrompt) =>
        currentPrompt.id === prompt.id
          ? {
              ...currentPrompt,
              usageCount: nextUsageCount,
            }
          : currentPrompt
      )
    );

    try {
      await updatePrompt(prompt.id, {
        title: prompt.title,
        text: prompt.text,
        category: prompt.category,
        usageCount: nextUsageCount,
      });
    } catch (error) {
      setErrorMessage(error.message || 'Unable to update prompt usage.');
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(prompt.text);
      } catch {
        // Usage should still be tracked if clipboard permissions are unavailable.
      }
    }
  }

  const safePrompts = Array.isArray(prompts) ? prompts : [];
  const availableTags = ['All', ...new Set(safePrompts.map((prompt) => prompt.category))];
  const filteredPrompts =
    selectedTag === 'All'
      ? safePrompts
      : safePrompts.filter((prompt) => prompt.category === selectedTag);
  const totalUses = safePrompts.reduce(
    (total, prompt) => total + (prompt.usageCount ?? 0),
    0
  );
  const topPrompts = [...safePrompts]
    .sort((firstPrompt, secondPrompt) => {
      const usageDifference =
        (secondPrompt.usageCount ?? 0) - (firstPrompt.usageCount ?? 0);

      if (usageDifference !== 0) {
        return usageDifference;
      }

      return firstPrompt.title.localeCompare(secondPrompt.title);
    })
    .slice(0, 5);
  const userEmail = session?.user?.email ?? '';

  if (isCheckingSession) {
    return (
      <div className="app-shell">
        <div className="container">
          <section className="panel auth-panel" aria-label="Checking session">
            <p className="eyebrow">Prompt Library</p>
            <h1>Checking your session...</h1>
          </section>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <div className="container">
          <section className="panel auth-panel">
            <p className="eyebrow">Prompt Library</p>
            <h1>{authMode === 'sign-in' ? 'Sign in' : 'Create account'}</h1>
            <p className="subtitle">
              Save prompts to your private cloud library and pick up where you left off.
            </p>

            <form className="prompt-form" onSubmit={handleAuthSubmit}>
              {authMessage ? (
                <div className="error-banner" role="alert">
                  {authMessage}
                </div>
              ) : null}

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  placeholder="you@example.com"
                  disabled={isAuthSubmitting}
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  placeholder="At least 6 characters"
                  disabled={isAuthSubmitting}
                />
              </label>

              <div className="form-actions">
                <button type="submit" disabled={isAuthSubmitting}>
                  {isAuthSubmitting
                    ? 'Please wait...'
                    : authMode === 'sign-in'
                      ? 'Sign In'
                      : 'Create Account'}
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => {
                    setAuthMode((currentMode) =>
                      currentMode === 'sign-in' ? 'sign-up' : 'sign-in'
                    );
                    setAuthMessage('');
                  }}
                  disabled={isAuthSubmitting}
                >
                  {authMode === 'sign-in' ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <p className="eyebrow">Prompt Library</p>
          <h1>Prompt dashboard</h1>
          <p className="subtitle">
            Keep the prompts you reach for most at the top, with quick access to the full library.
          </p>
          <div className="account-bar">
            <span>{userEmail}</span>
            <button className="button-secondary" type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="dashboard" aria-label="Prompt dashboard">
          <div className="stat-grid">
            <div className="stat">
              <span>Total Prompts</span>
              <strong>{safePrompts.length}</strong>
            </div>
            <div className="stat">
              <span>Total Uses</span>
              <strong>{totalUses}</strong>
            </div>
            <div className="stat">
              <span>Tags</span>
              <strong>{availableTags.length - 1}</strong>
            </div>
          </div>

          <section className="panel top-prompts-panel">
            <div className="section-heading">
              <h2>Top 5 Prompts</h2>
              <span>Most used</span>
            </div>

            {topPrompts.length === 0 ? (
              <div className="empty-state">
                <p>No prompt activity yet.</p>
                <p>Add a prompt and use it to build your dashboard.</p>
              </div>
            ) : (
              <ol className="top-prompts-list">
                {topPrompts.map((prompt, index) => (
                  <li className="top-prompt" key={prompt.id}>
                    <span className="rank">{index + 1}</span>
                    <div className="top-prompt-content">
                      <h3>{prompt.title}</h3>
                      <p>{prompt.category}</p>
                    </div>
                    <strong>{prompt.usageCount ?? 0}</strong>
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() => handleUse(prompt)}
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>

        <main className="layout">
          <section className="panel">
            <h2>{editingId ? 'Edit Prompt' : 'Add Prompt'}</h2>
            <form className="prompt-form" onSubmit={handleSubmit}>
              {errorMessage ? (
                <div className="error-banner" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <label>
                Title
                <input
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Newsletter outline"
                  disabled={isSaving}
                />
              </label>

              <label>
                Prompt Text
                <textarea
                  name="text"
                  value={form.text}
                  onChange={handleChange}
                  rows="7"
                  placeholder="Write a concise newsletter intro for..."
                  disabled={isSaving}
                />
              </label>

              <label>
                Category / Tag
                <input
                  name="category"
                  type="text"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Writing"
                  disabled={isSaving}
                />
              </label>

              <div className="form-actions">
                <button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Prompt'
                      : 'Save Prompt'}
                </button>
                {editingId ? (
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h2>Saved Prompts</h2>
              <span>{safePrompts.length} total</span>
            </div>

            {isLoading ? (
              <div className="empty-state">
                <p>Loading prompts...</p>
              </div>
            ) : safePrompts.length === 0 ? (
              <div className="empty-state">
                <p>{errorMessage ? 'Prompts could not be loaded.' : 'No prompts saved yet.'}</p>
                <p>
                  {errorMessage
                    ? 'Check your Supabase configuration and try again.'
                    : 'Add one with the form to get started.'}
                </p>
              </div>
            ) : (
              <>
                <div className="filter-row">
                  <label className="filter-control">
                    Filter by tag
                    <select
                      value={selectedTag}
                      onChange={(event) => setSelectedTag(event.target.value)}
                    >
                      {availableTags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {filteredPrompts.length === 0 ? (
                  <div className="empty-state">
                    <p>No prompts match this tag.</p>
                    <p>Choose another tag to see more prompts.</p>
                  </div>
                ) : (
                  <div className="prompt-list">
                    {filteredPrompts.map((prompt) => (
                      <article className="prompt-card" key={prompt.id}>
                        <div className="prompt-card-header">
                          <div className="prompt-card-title">
                            <h3>{prompt.title}</h3>
                            <span>{prompt.category}</span>
                          </div>
                          <div className="prompt-card-actions">
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => handleUse(prompt)}
                            >
                              Use
                            </button>
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => handleEdit(prompt)}
                            >
                              Edit
                            </button>
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => handleDelete(prompt.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="usage-line">
                          Used {prompt.usageCount ?? 0}{' '}
                          {(prompt.usageCount ?? 0) === 1 ? 'time' : 'times'}
                        </div>
                        <p>{prompt.text}</p>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
