import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Divider, Typography } from '@mui/material';
import { fetchSessionObject } from '../components/common/SessionAPI';

// Define the expected URL parameters.
interface NewsPageParams extends Record<string | "", string | ""> {
  sessionName: string;
  empireName: string;
  turnNumber: string;
}

export default function NewsPage() {
  const { sessionName, empireName, turnNumber } = useParams<NewsPageParams>();
  const [loading, setLoading] = useState<boolean>(true);
  const [news, setNews] = useState<string>('');

  useEffect(() => {
     async function loadNews() {
           try {
              const apiData = await fetchSessionObject(
                    sessionName ?? "",
                    empireName ?? "",
                    Number(turnNumber),
                    "NEWS"
              );
              if (!apiData) {
                  setNews("No turn " + turnNumber + " news for empire " + empireName);
                  return;
              }
              const json = JSON.parse(apiData);
              if (json.data) {
                  setNews(json.data);
              }
              else {
                  setNews(json.message);
              }
           } catch (error) {
              console.error("Error loading news:", error);
              setNews("No turn " + turnNumber + " news for empire " + empireName);
           } finally {
              setLoading(false);
           }
        }
        loadNews();
  }, [sessionName, empireName, turnNumber]);


  if (loading) {
    return <Typography variant="h6">Loading news...</Typography>;
  }

  function parseNewsSections(newsText: string): { header: string; body: string[] }[] {
    const sections: { header: string; body: string[] }[] = [];
    if (!newsText) {
        return sections;
    }

    if (!newsText.includes("=")) {
        sections.push({ header: newsText, body: [] });
        return sections;
    }
    const lines = newsText.split('\n');
    let i = 0;

    while (i < lines.length) {
      // Skip top separator lines
      if (lines[i].startsWith('=')) {
          i++;
      }

      // Get phase header
      const header = lines[i++]?.trim();

      if (lines[i].startsWith('=')) {
          i++;
      }

      // Collect body lines until next phase or EOF
      const body: string[] = [];
      while (i < lines.length && !lines[i].startsWith('=')) {
          const line = lines[i++].trim();
          body.push(line);
      }

      if (header) {
          sections.push({ header, body });
      }
    }

    return sections;
  }

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="h5" gutterBottom>
        Session {sessionName} news for {empireName}, turn {turnNumber}
      </Typography>
      <div style={{ marginTop: 16 }}>
        {parseNewsSections(news).map((section, idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            <Divider sx={{ marginBottom: 2, borderColor: 'white' }} />
            <Typography style={{color: 'lightblue'}} variant="h6" gutterBottom>
              {section.header}
            </Typography>
            {section.body.map((line, j) => (
              <Typography variant="h5" key={j} style={{ marginLeft: 16 }}>
                {line}
              </Typography>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}