import { useState, useEffect } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

interface Clip {
  filename: string;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  score: number;
}

interface DashboardData {
  clips: Clip[];
  shorts: string[];
  metadata: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Load clips data
      const clipsDir = path.join(process.cwd(), "samples", "clips");
      const shortsDir = path.join(process.cwd(), "samples", "shorts");
      const subsDir = path.join(process.cwd(), "samples", "subs");

      const clips = await fs.readdir(clipsDir).catch(() => []);
      const shorts = await fs.readdir(shortsDir).catch(() => []);
      const metadata = await fs.readdir(subsDir).catch(() => []);

      setData({
        clips: clips
          .filter((f) => f.endsWith(".mp4"))
          .map((f) => ({
            filename: f,
            start_sec: 0,
            end_sec: 30,
            duration_sec: 30,
            score: Math.random() * 100,
          })),
        shorts: shorts.filter((f) => f.endsWith(".mp4")),
        metadata: metadata.filter((f) => f.endsWith(".json")),
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Content Engine Dashboard</h1>

      <div className="grid">
        <div className="card">
          <h2>📹 Clips ({data?.clips.length || 0})</h2>
          <ul>
            {data?.clips.map((clip, i) => (
              <li key={i}>
                {clip.filename} ({clip.duration_sec}s) - Score:{" "}
                {clip.score.toFixed(1)}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>🎬 Final Shorts ({data?.shorts.length || 0})</h2>
          <ul>
            {data?.shorts.map((short, i) => (
              <li key={i}>{short}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>📝 Metadata ({data?.metadata.length || 0})</h2>
          <ul>
            {data?.metadata.map((meta, i) => (
              <li key={i}>{meta}</li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }

        h1 {
          color: #333;
          margin-bottom: 30px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e9ecef;
        }

        .card h2 {
          margin-top: 0;
          color: #495057;
          font-size: 1.2em;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        li {
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }

        li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
