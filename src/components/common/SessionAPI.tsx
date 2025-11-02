// src/utils/sessionAPI.ts

export async function fetchSessionObject(
  sessionName: string,
  empireName: string,
  turnNumber: number,
  sessionObject: string
): Promise<any> {
    try {
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
      if (response.status===404) {
          return "";
      }
//    console.log("ok = " + JSON.stringify(response.ok));
//    console.log("response text = " + response.statusText);
//         if (response.status === 404) {
//            console.error(`Error: Resource not found. Received status 404 for URL`);
//          } else {
//            console.error(`Error fetching session object: ${response.status} ${response.statusText}`);
//          }
       if (response.ok && response.status===200) {
           return await response.text();
       }
       return "";
    } catch (error) {
      console.error("Error in fetchSessionObject:", error);
      throw error;
    }
}
export async function loadOrdersStatus(sessionName: string, empireName: string, turnNumber: number): Promise<string> {
    try {
      const apiData = await fetchSessionObject(
                       sessionName ?? "",
                       empireName ?? "",
                       Number(turnNumber),
                       "ORDERS_STATUS"
      );
      if (apiData) {
          const processedText = apiData.replace(/(\r\n|\n|\r)/g, "\\n");
          const json = JSON.parse(processedText);
          return json.data;
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
    return "UNKNOWN";
}

export async function updateTurn(sessionName: string, turnNumber: number): Promise<string> {
    try {
       const response = await fetch("https://api.starempires.com/updateTurn", {
         method: "POST",
         headers: {
           "Authorization": "Bearer REAL_JWT_TOKEN", // Replace with your token logic
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           sessionName,
           turnNumber,
         }),
       });
       if (response.status===404) {
          return "";
       }
       if (response.ok && response.status===200) {
           return await response.text();
       }
       return "";
    } catch (error) {
      console.error("Error in updateTurn:", error);
      throw error;
    }
}

export async function generateSnapshots(sessionName: string, turnNumber: number): Promise<string> {
    try {
       const response = await fetch("https://api.starempires.com/generateSnapshots", {
         method: "POST",
         headers: {
           "Authorization": "Bearer REAL_JWT_TOKEN", // Replace with your token logic
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           sessionName,
           turnNumber,
         }),
       });
       if (response.status===404) {
          return "";
       }
       if (response.ok && response.status===200) {
           return await response.text();
       }
       return "";
    } catch (error) {
      console.error("Error in generateSnapshots:", error);
      throw error;
    }
}

export async function createSession(
  sessionName: string,
  overrideProps: Record<string, string> = {}
): Promise<string> {
    try {
       const payload = { sessionName, overrideProps };
//        console.log('createSession payload (API):', JSON.stringify(payload));
       const response = await fetch("https://api.starempires.com/createSession", {
         method: "POST",
         headers: {
           "Authorization": "Bearer REAL_JWT_TOKEN", // Replace with your token logic
           "Content-Type": "application/json",
         },
         body: JSON.stringify(payload),
       });
       if (response.status===404) {
          return "";
       }
       if (response.ok && response.status===200) {
           return await response.text();
       }
       return "";
    } catch (error) {
      console.error("Error in createSession:", error);
      throw error;
    }
}

export async function startSession(
  sessionName: string
): Promise<string> {
    try {
       const payload = { sessionName };
       const response = await fetch("https://api.starempires.com/startSession", {
         method: "POST",
         headers: {
           "Authorization": "Bearer REAL_JWT_TOKEN", // Replace with your token logic
           "Content-Type": "application/json",
         },
         body: JSON.stringify(payload),
       });
       if (response.status===404) {
          return "";
       }
       if (response.ok && response.status===200) {
           return await response.text();
       }
       return "";
    } catch (error) {
      console.error("Error in startSession:", error);
      throw error;
    }
}

export async function addEmpire(
  sessionName: string,
  empireName: string,
  abbreviation: string,
  homeworld: string,
  starbase: string
): Promise<string> {
    try {
       const payload = { sessionName, empireName, abbreviation, homeworld, starbase };
       const response = await fetch("https://api.starempires.com/addEmpire", {
         method: "POST",
         headers: {
           "Authorization": "Bearer REAL_JWT_TOKEN", // Replace with your token logic
           "Content-Type": "application/json",
         },
         body: JSON.stringify(payload),
       });
       if (response.status===404) {
          return "";
       }
       if (response.ok && response.status===200) {
           return await response.text();
       }
       return "";
    } catch (error) {
      console.error("Error in addEmpire:", error);
      throw error;
    }
}

export async function loadSnapshot(sessionName: string, empireName: string, turnNumber: number): Promise<string> {
    try {
       const apiData = await fetchSessionObject(
                  sessionName ?? "",
                  empireName ?? "",
                  turnNumber,
                  "SNAPSHOT"
       );
       if (apiData) {
           const json = JSON.parse(apiData);
           return json.data;
       }
   } catch (error) {
            console.error("Error loading snapshot:", error);
   }
   return "";
}