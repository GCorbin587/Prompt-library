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

    setPrompts((currentPrompts) => [
      {
        id: crypto.randomUUID(),
        title,
        text,
        category,
      },
      ...currentPrompts,
    ]);

    setForm(emptyForm);
  }

  const safePrompts = Array.isArray(prompts) ? prompts : [];

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
            <h2>Add Prompt</h2>
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

              <button type="submit">Save Prompt</button>
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
              <div className="prompt-list">
                {safePrompts.map((prompt) => (
                  <article className="prompt-card" key={prompt.id}>
                    <div className="prompt-card-header">
                      <h3>{prompt.title}</h3>
                      <span>{prompt.category}</span>
                    </div>
                    <p>{prompt.text}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;