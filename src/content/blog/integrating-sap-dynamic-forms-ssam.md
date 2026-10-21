---
title: "Configuring SAP Dynamic Forms for SAP Service & Asset Manager"
description: "A step-by-step technical implementation guide to integrating SAP Dynamic Forms with SAP S/4HANA and SAP Service and Asset Manager (SSAM) across SM59, /SYCLO/ADMIN, SICF, SNRO, and /SYCLO/CONFIGPANEL."
pubDate: 2026-03-10
category: "technical"
tags: ["Dynamic Forms", "SSAM 2505", "S/4HANA", "BTP Mobile", "MAIF", "Field Mobility"]
readingTime: "8 min read"
draft: false
linkedInUrl: "https://www.linkedin.com/pulse/configuring-sap-dynamic-forms-service-asset-manager-wl0pf/?trackingId=ez8naSxONLbzHueUrPqzhQ%3D%3D"
---

The integration of **SAP Dynamic Forms** with the core **SAP S/4HANA** back-end and the **SAP Service and Asset Manager (SSAM)** application requires precise technical configuration across several SAP transactions. 

This guide outlines the key steps necessary to achieve seamless deployment and functionality, ensuring asset maintenance processes leverage flexible, dynamic form capabilities directly within field technicians' mobile workflows.

> [!NOTE]
> **LinkedIn Pulse Publication**: This guide was originally published on LinkedIn Pulse as [Configuring SAP Dynamic Forms for SAP Service & Asset Manager](https://www.linkedin.com/pulse/configuring-sap-dynamic-forms-service-asset-manager-wl0pf/?trackingId=ez8naSxONLbzHueUrPqzhQ%3D%3D). Join the discussion with enterprise asset management and mobility architects on LinkedIn.

---

## Architectural Workflow: End-to-End Form Processing

The following diagram illustrates how SAP Dynamic Forms integrates across the SAP BTP Subaccount, S/4HANA on-premise/private cloud core, and the offline SSAM mobile client:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAP BTP Subaccount (Cloud Services)                      │
│   ┌─────────────────────────────────┐   ┌────────────────────────────────┐  │
│   │   SAP Dynamic Forms Service     │   │   BTP Mobile Services          │  │
│   │   (Fiori Launchpad Form Store)  │   │   (Offline OData v4 Proxy)     │  │
│   └────────────────┬────────────────┘   └────────────────┬───────────────┘  │
└────────────────────┼─────────────────────────────────────┼──────────────────┘
                     │ Type 'G' HTTP RFC (SM59)            │ Principal Prop.
                     ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAP S/4HANA Back-End Core & MAIF                         │
│   ┌─────────────────────────────────┐   ┌────────────────────────────────┐  │
│   │ /SYCLO/ADMIN Component:         │   │ /SYCLO/CONFIGPANEL:            │  │
│   │ BTP_DYNAMIC_FORM_SERVICE        │───│ • CA_DYNAMIC_FORMS Feature     │  │
│   │ (Form Retrieval & S/4 Linkage)  │   │ • SAM2410 Form MDOs & DMS Event│  │
│   └─────────────────────────────────┘   └────────────────┬───────────────┘  │
│   ┌─────────────────────────────────┐                    │                  │
│   │ SICF: sdf_form_explorer         │                    │ Delta Sync       │
│   │ SNRO: /SMFND/D4M & /SMFND/FR1   │                    │                  │
│   └─────────────────────────────────┘                    ▼                  │
└──────────────────────────────────────────────────────────┼──────────────────┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SSAM Mobile Client (Offline Store)                       │
│   ┌─────────────────────────────────┐   ┌────────────────────────────────┐  │
│   │ Mobile Work Order / Notification│───│ Dynamic Form Webview Container │  │
│   │ (Functional Location, Equipment)│   │ (Attached as DMS PDF on sync)  │  │
│   └─────────────────────────────────┘   └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Preparing the SAP S/4HANA Back-End

Before integration can begin, the SAP ERP back-end system must be prepared with the necessary prerequisites and core integration components:

- **Upgrade Path:** The system upgrade is performed via the **S4CORE TCI note approach**.
- **MAIF Installation:** The **Mobile Application Integration Framework (MAIF)** for SAP S/4HANA on-premise or private cloud edition must be installed using **SAP Note 2977434**.
- **Business Configuration Sets:** Note that there is no separate BC Set for SAP Dynamic Forms; its activation is handled as part of the **SAP Service and Asset Manager BC Set** starting from the **SSAM 2410** version.

---

## Step 2: Establishing Cloud Connectivity via RFC Destinations (`SM59`)

SAP Dynamic Forms relies on external services hosted on the **SAP Business Technology Platform (SAP BTP)**. Therefore, two distinct Remote Function Call (RFC) destinations must be established in transaction `SM59` to link the on-premise system to cloud services.

### Prerequisite: Technical User Setup
A technical user must first be created in the SAP BTP Subaccount subscribed to SAP Dynamic Forms, ensuring this user has the correct roles assigned and is registered with the Default Identity Provider.

### 1. RFC Destination for Form Retrieval (Type `G`)
- **Connection Type:** Type `G` (*HTTP Connection to External Server*). Defined specifically to retrieve Dynamic Forms from SAP BTP.
- **Technical Settings:** Must include the host for the SAP Dynamic Forms Fiori launchpad.
- **Logon & Security:** Uses **Basic Authentication** with the credentials of the technical user created in the prerequisite step.

### 2. RFC Destination for Service Linkage (Type `G`)
- **Connection Type:** A second Type `G` RFC Destination is required to establish the connection from SSAM to S/4.
- **Technical Settings:** The Host for this RFC must be the specific **Provider URL** corresponding to your SAP BTP Subaccount Region.

---

## Step 3: Configuring the Mobile Application System Component (`/SYCLO/ADMIN`)

This step links the mobile application middleware to the newly created RFC connections in transaction `/SYCLO/ADMIN` (*Administration > Server Management*):

1. In `/SYCLO/ADMIN`, create a new server entry.
2. **Basic Info Tab:**
   - Select **SAP Dynamic Forms** in the *Mobile Application* dropdown.
   - Crucially, select the **`BTP_DYNAMIC_FORM_SERVICE`** system component.
   - Select the **first RFC destination** (configured in Step 2 for retrieving forms from BTP).
3. **Additional Properties Tab:**
   - Add a new property with `Property Group = APPLICATION`.
   - Set `Property Name = DYNAMIC_FORMS_SERVICE`.
   - Set `Property Value =` the **second RFC destination** (connecting SSAM to S/4).

| Tab | Parameter | Value / Target |
| :--- | :--- | :--- |
| **Basic Info** | Mobile Application | `SAP Dynamic Forms` |
| **Basic Info** | System Component | `BTP_DYNAMIC_FORM_SERVICE` |
| **Basic Info** | RFC Destination | First RFC Destination *(BTP Form Retrieval)* |
| **Additional Properties** | Property Group | `APPLICATION` |
| **Additional Properties** | Property Name | `DYNAMIC_FORMS_SERVICE` |
| **Additional Properties** | Property Value | Second RFC Destination *(SSAM to S/4)* |

---

## Step 4: Activating Services & Number Ranges (`SICF` & `SNRO`)

To enable core system functionality and runtime identifier sequencing, perform the administrative tasks in `SICF` and `SNRO`:

### 1. Form Explorer Activation (`SICF`)
The service for the **Dynamic Forms – Form Explorer Application** must be activated in transaction `SICF`.
- **Service Path:** `default_host/sap/bc/webdynpro/smfnd/sdf_form_explorer`
- Execute activation by right-clicking the node and selecting **Activate Service**.

### 2. Number Range Maintenance (`SNRO`)
Intervals must be defined in transaction `SNRO` for two specific number range objects:

| Object | Interval | Value Range (From ~ To) | Purpose |
| :--- | :--- | :--- | :--- |
| **`/SMFND/D4M`** | `01` | `0000000001` ~ `0199999999` | Dynamic Form Definition Identifiers |
| **`/SMFND/FR1`** | `01` | `0000000001` ~ `0199999999` | Dynamic Form Runtime Instances |

---

## Step 5: Integrating Dynamic Forms within SSAM (`/SYCLO/CONFIGPANEL`)

The final integration steps are performed in the Mobile Application Integration Framework (MAIF) configuration panel, accessed via transaction `/SYCLO/CONFIGPANEL`.

### 1. Activate Features and Personas
- **User Personas:** Navigate to *Component Assignments* and, under the *User Personas* tab, filter by the **`CA_DYNAMIC_FORMS`** App Feature ID. Ensure the **Active** flag is checked for all relevant user personas.
- **Feature Activation:** Under *Mobile Application Configuration > Features*, activate the feature ID **`CA_DYNAMIC_FORMS`** to enable SAP Dynamic Forms integration across mobile handlers.

### 2. Assign Exchange Objects
Under the **xChange Object Assignment** tab:
- Filter by the `CA_DYNAMIC_FORMS` app feature ID.
- Enable the exchange objects corresponding to the SAP asset objects that will utilize dynamic forms (e.g., **Equipment**, **Notification**, **Work Order**).

### 3. Configure Dynamic Forms Agent Object (Event Processing)
For each relevant Form Agent Object (e.g., `SDF_NOTIFICATION`, `SDF_WORKORDER`):
- Configure the **Form Definition Assignment** and ensure the dynamic forms are marked as **Active**.
- In the **Event Processing** tab, set up actions:
  - Configure the **`UPDATE`** Trigger Action (*Processing Type: After Action*) to use the Event Handler **`/MERP/CL_SDF_EVT_ATTACH_DMS`**.
  - This event handler automatically renders the completed mobile form response as a PDF and attaches it directly to the SAP business object as a **Document Management System (DMS)** document.
  - Specify Event Parameters:
    - `RELEVANT_FORM_DEFINITIONS`: Target form template IDs.
    - `FILE_NAME`: Descriptive file naming pattern (e.g., form description + timestamp).
    - `OBJECT_DOC_TYPE`: Target SAP Document Type (e.g., `DRW`).

### 4. Configure Mobile Data Objects (MDOs)

| Mobile Data Object (MDO) | Configuration Parameter | Setting / Target |
| :--- | :--- | :--- |
| **`SAM2410_DYNAMIC_FORM_INSTANCE`** | `OBJECT_DISTRIBUTION_MODE` | Active distribution profile |
| **`SAM2410_DYNAMIC_FORM_INSTANCE`** | `FORM_STATUS` Filter | Include `'New'` and `'In Process'` |
| **`SAM2410_DYNAMIC_FORM_INSTANCE`** | `USE_FORM_REGISTRY_STATUS` | `'X - True'` |
| **`SAM2410_Dynamic_Form_Linkage`** | `USE_FORM_STATUS_FROM` | References Form Instance MDO status |
| **`SAM2410_Dynamic_Form_Template`** | `FORM_DEFINITIONS` | Explicit input: App Name, Form Name, Version |
| **`SAM2410_Dynamic_Form_Template`** | `OBJECT_DISTRIBUTION_MODE` | Define ranges for template staging |

---

## Conclusion

By following these configuration steps, your **SAP S/4HANA** back-end and **SAP Service and Asset Manager** mobile platform will be fully prepared to utilize the flexible and powerful capabilities of **SAP Dynamic Forms**. 

This end-to-end setup ensures that forms are correctly retrieved from BTP, deployed to field technicians' mobile devices for offline execution, and seamlessly processed back into core SAP asset history with automated DMS document attachments.

---

### Reference & Discussion
*This article was published on [LinkedIn Pulse](https://www.linkedin.com/pulse/configuring-sap-dynamic-forms-service-asset-manager-wl0pf/?trackingId=ez8naSxONLbzHueUrPqzhQ%3D%3D). Join the discussion with enterprise mobility architects on LinkedIn, or connect with [Sabarish Kamaraju on LinkedIn](https://www.linkedin.com/in/sabarish-k-6b979918/) for continuous architectural perspectives across S/4HANA EAM, SAP BTP, and field mobility.*
