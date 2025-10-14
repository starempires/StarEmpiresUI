import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { fetchSessionObject } from '../components/common/SessionAPI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="h5" gutterBottom>
        Session {sessionName} news for {empireName}, turn {turnNumber}
      </Typography>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {news}
      </ReactMarkdown>
    </div>
  );
}