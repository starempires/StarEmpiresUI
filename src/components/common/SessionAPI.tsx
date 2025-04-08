// src/utils/sessionAPI.ts

export async function fetchSessionObject(
  sessionName: string,
  empireName: string,
  turnNumber: number,
  sessionObject: string
): Promise<any> {
       const response = await fetch("https://api.starempires.com/getSessionObject", {
         method: "POST",
         headers: {
           "Authorization": "Bearer REAL_JWT_TOKEN", // Replace with your token logic
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           sessionName,
           empireName,
           turnNumber,
           sessionObject,
         }),
       });
       if (response.ok) {
           return await response.text();
       }
       return "";
}