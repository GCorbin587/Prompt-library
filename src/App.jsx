import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'prompt-library-prompts';

const emptyForm = {
  title: '',
  text: '',
  category: '',
};

function App() {
  const [form, setForm] = useState(emptyForm);
  const [prompts, setPrompts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    const savedPrompts = localStorage.getItem(STORAGE_KEY);

    if (!savedPrompts) {
      setPrompts([]);
      return;
    }

    try {
      const parsed = JSON.parse(savedPrompts);
      setPrompts(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPrompts([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, [prompts]);

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

  function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    const text = form.text.trim();
    const category = form.category.trim();

    if (!title || !text || !category) {
      return;
    }

    if (editingId) {
      setPrompts((currentPrompts) =>
        currentPrompts.map((prompt) =>
          prompt.id === editingId
            ? {
                ...prompt,
                title,
                text,
                category,
              }
            : prompt
        )
      );
      setEditingId(null);
    } else {
      setPrompts((currentPrompts) => [
        {
          id: crypto.randomUUID(),
          title,
          text,
          category,
        },
        ...currentPrompts,
      ]);
    }

    setForm(emptyForm);
  }

  function handleEdit(prompt) {
    setForm({
      title: prompt.title,
      text: prompt.text,
      category: prompt.category,
    });
    setEditingId(prompt.id);
  }

  function handleDelete(promptId) {
    setPrompts((currentPrompts) =>
      currentPrompts.filter((prompt) => prompt.id !== promptId)
    );

    if (editingId === promptId) {
      setEditingId(null);
      setForm(emptyForm);
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  const safePrompts = Array.isArray(prompts) ? prompts : [];
  const availableTags = ['All', ...new Set(safePrompts.map((prompt) => prompt.category))];
  const filteredPrompts =
    selectedTag === 'All'
      ? safePrompts
      : safePrompts.filter((prompt) => prompt.category === selectedTag);

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <p className="eyebrow">Prompt Library</p>
          <h1>Save prompts you want to reuse.</h1>
          <p className="subtitle">
            Add a title, the full prompt text, and a category so everything stays easy to find.
          </p>
        </header>

        <main className="layout">
          <section className="panel">
            <h2>{editingId ? 'Edit Prompt' : 'Add Prompt'}</h2>
            <form className="prompt-form" onSubmit={handleSubmit}>
              <label>
                Title
                <input
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Newsletter outline"
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
                />
              </label>

              <div className="form-actions">
                <button type="submit">
                  {editingId ? 'Update Prompt' : 'Save Prompt'}
                </button>
                {editingId ? (
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={handleCancelEdit}
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

            {safePrompts.length === 0 ? (
              <div className="empty-state">
                <p>No prompts saved yet.</p>
                <p>Add one with the form to get started.</p>
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
