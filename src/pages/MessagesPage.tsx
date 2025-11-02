import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { List, ListItemButton, ListItemText, Divider, Typography } from '@mui/material';
import { getReceivedMessages, getSentMessages } from '../components/common/ClientFunctions';

// Define the interface for a Message (based on your schema in resource.ts)
interface Message {
  id: string;
  sender: string;
  broadcast: boolean;
  anonymous: boolean;
  content: string;
  sent: string;    // ISO Date string
}

// Define the expected URL parameters.
interface MessagePageParams extends Record<string | "", string | ""> {
  sessionName: string | "";
  empireName: string | "";
}

// interface MessagePageProps {
//   userAttributes: any;
//

export default function MessagePage() {
  const { sessionName, empireName } = useParams<MessagePageParams>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);


  // Fetch all messages for the given session and empire.
  // We assume that a message qualifies if the sessionName matches AND either the sender equals the empireName
  // or the recipients array contains the empireName.
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messages = await getSentMessages(sessionName!, empireName!);
        console.log("sent messages = " + JSON.stringify(messages));
        const received = await getReceivedMessages(sessionName!, empireName!);
        console.log("received messages = " + JSON.stringify(received));
//         const promises = received.map((recipient) => fetchMessages(recipient.id));
//         const result = await.Promise.all(promises);
//         const receivedMessages = result.flat();
//         console.log("receivedMessages = " + JSON.stringify(receivedMessages));

       const sortedMessages = messages.sort((a: Message, b: Message) => {
         return new Date(b.sent).getTime() - new Date(a.sent).getTime();
       });

        setMessages(sortedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionName && empireName) {
      fetchMessages();
    }
  }, [sessionName, empireName]);

  // When a message is clicked, mark it as read by updating its "read" field.
  const handleClickMessage = async (message: Message) => {
       console.log("clicked message = " + JSON.stringify(message));
//
//     try {
//       // Update the message by setting its read field to the current date/time.
//       const updatedMessage = await client.models.Message.update({
//         ...message,
// //         read: new Date().toISOString()
//       });
//       // Update local state: Replace the updated message in the messages array.
//       setMessages(prev =>
//         prev.map((m) => (m.id === message.id ? updatedMessage : m))
//       );
//     } catch (error) {
//       console.error("Error marking message as read:", error);
//     }
  };

  if (loading) {
    return <Typography variant="h6">Loading messages...</Typography>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="h5" gutterBottom>
        Session {sessionName} messages for {empireName}
      </Typography>
      {messages.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2, color: 'textSecondary' }}>
          No messages
        </Typography>
      ) : (
        <List>
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
              <ListItemButton onClick={() => handleClickMessage(msg)}>
                <ListItemText
                  primary={`From: ${msg.sender} (Sent: ${new Date(msg.sent).toLocaleString()})`}
                  secondary={msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')}
                  primaryTypographyProps={{ style: { color: 'lightgray' } }}
                  secondaryTypographyProps={{ style: { color: 'lightgray' } }}
                />
              </ListItemButton>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </div>
  );
}