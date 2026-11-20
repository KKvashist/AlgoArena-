import { Link } from "react-router-dom";
import { topicList } from "../data/topics";
import "./TopicCards.css";

// Drop <TopicCards /> into Dashboard.jsx where your old "continue.learning" cards were.
export default function TopicCards() {
  return (
    <section className="tc-section">
      <p className="tc-label">// continue.learning</p>
      <div className="tc-row">
        {topicList.map((t) => (
          <Link key={t.slug} to={`/topic/${t.slug}`} className="tc-card">
            <div className="tc-icon">{t.icon}</div>
            <h3>{t.title}</h3>
            <div className="tc-bar"><span style={{ width: `${t.progress}%` }} /></div>
            <small>{t.progress}% complete</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
.tc-section { margin: 32px 0; }
.tc-label { font-family: monospace; font-size: 12px; color: #22d3ee; margin: 0 0 14px; }
.tc-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
.tc-card { display: block; padding: 20px; border-radius: 14px; background: #0f1626; border: 1px solid #1e293b;
  text-decoration: none; color: #e6edf7; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }
.tc-card:hover { transform: translateY(-3px); border-color: #22d3ee; box-shadow: 0 8px 24px rgba(34, 211, 238, 0.15); }
.tc-icon { font-size: 28px; margin-bottom: 10px; }
.tc-card h3 { margin: 0 0 14px; font-size: 16px; }
.tc-bar { height: 6px; border-radius: 99px; background: #1e293b; overflow: hidden; margin-bottom: 10px; }
.tc-bar span { display: block; height: 100%; background: linear-gradient(90deg, #22d3ee, #8b5cf6); }
.tc-card small { font-family: monospace; color: #7b8aa3; }