# SocialProfiler

A Black-Mirror-style web application for creating rich “character sheets” of real acquaintances.  
Originally designed to help individuals with autism, social anxiety, or memory difficulties remember key social details, it combines a sleek cyber-noir UI with a Bayesian inference engine that predicts personality traits, motivations, vulnerabilities, and optimal rapport-building tactics.

---

## ✨ Features
- **Character Builder** – modular avatar or image upload, extensive form with predefined dropdowns and sliders.  
- **Bayesian Autocomplete** – choose a few traits and let the algorithm probabilistically fill the rest.  
- **Relationship Graph** – interactive network (vis-network) displaying connections, type, trust and strength.  
- **Compatibility & Rapport** – automatic compatibility scoring and tailored rapport strategies.  
- **Local-First Storage** – everything lives in your browser (with import/export & backup).  
- **Dark “Black Mirror” Aesthetic** – futuristic neon grid, animated cards, responsive design.  
- **Settings & Privacy Controls** – fine-tune algorithm aggressiveness, network layout, backups, etc.

---

## 🛠 Tech Stack
| Layer | Tech |
|-------|------|
| Front-end | React 18 + TypeScript + React Router |
| State | React Context + LocalStorage |
| Styling | Custom CSS (dark neon theme) |
| Visualization | vis-network |
| Core Logic | Custom Bayesian inference service (TypeScript) |
| Tooling | Create React App, ESLint, Web Vitals |

---

## 📦 Installation
```bash
git clone https://github.com/your-user/socialprofiler.git
cd socialprofiler
npm install
```

---

## ▶️ Running the App
```bash
npm start
```
Opens `http://localhost:3000` in your default browser.  
For production:
```bash
npm run build
```

---

## 🚀 Quick Usage Guide
1. **Create Character** – click “New Character”, fill basic info (or alias) and avatar.  
2. **Add Traits** – select personality, communication, etc.  
3. **Autocomplete** – press 🧠 icon to let the Bayesian engine finish the profile.  
4. **Relationships** – in a character card or Network view, add edges between people.  
5. **Network View** – explore the graph; filter by role/relationship type, export PNG/JSON.  
6. **Settings** – adjust algorithm thresholds, auto-backup, theme, and privacy options.  
7. **Backup / Restore** – JSON files include both data & settings.

---

## ⚖️ Ethical Considerations & Disclaimer
This project exists to **assist** people with social or memory challenges, not to manipulate others.

* • Obtain **explicit consent** from any real person before storing their data.  
* • Do **not** use SocialProfiler for harassment, blackmail, stalking, or other illegal activities.  
* • The Bayesian model provides **probabilities**, *not diagnoses*; treat results as speculative.  
* • All data stays **local** unless you export it—secure your device accordingly.  
* • The authors assume **no liability** for misuse.

---

## 🤝 Contributing
PRs are welcome! Please open an issue first to discuss major changes.  
Follow conventional commits, run `npm test`, and respect the code of conduct.

---

## 📄 License
This repository is released under the MIT License. See `LICENSE` for details.
