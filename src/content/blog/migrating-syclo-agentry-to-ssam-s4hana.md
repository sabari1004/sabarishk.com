---
title: "Architectural Blueprint: Migrating Legacy Syclo-Agentry to SAP Service & Asset Manager on S/4HANA"
description: "A comprehensive technical playbook for de-risking the migration from legacy SMP 3.0 / Syclo-Agentry runtimes to modern MDK and Offline OData on SAP BTP and S/4HANA."
pubDate: 2026-03-20
category: "technical"
tags: ["SAP SSAM", "Agentry", "S/4HANA", "Mobile Services", "BTP", "Architecture"]
readingTime: "11 min read"
draft: false
---

For more than a decade, enterprise asset management in utilities, oil & gas, and manufacturing relied heavily on **Syclo-Agentry** platforms—most notably **SAP Work Manager (6.0 through 6.5)** and **SAP Inventory Manager**. Powered by SAP Mobile Platform (SMP 3.0) and on-premise Java/Agentry servers, these systems enabled field personnel to inspect assets and execute work orders disconnected from corporate networks.

However, with SMP 3.0 reaching end-of-life, Windows Server dependencies aging out, and modern mobile OS releases (iOS 18+ and Android 15+) breaking legacy Agentry OpenUI wrappers, organizations must execute a modernization roadmap. The destination is **SAP Service and Asset Manager (SSAM 2410 / 2505)** built on **SAP BTP Mobile Services** and **S/4HANA**.

In this architectural blueprint, I break down the migration strategy, comparing core runtime architectures, mapping data synchronization models, and demonstrating how to convert proprietary Java/Agentry logic into clean **MDK rules** and **MAIF backend exits**.

---

## The End-of-Life Reality: SMP 3.0 vs. Modern Cloud Architecture

The technical debt inherent in legacy Agentry deployments manifests in three critical failure modes:

1. **Monolithic On-Premise Infrastructure:** SMP 3.0 requires complex on-premise Windows/Linux clusters, stateful Java virtual machines, and dedicated Agentry communication proxies that struggle to scale elastically.
2. **Proprietary 4GL Scripting & Java Stepping:** Business logic in Agentry is split between proprietary XML/Agentry editor definitions and compiled Java OpenSearch/Fetch classes. Debugging mobile memory leaks requires low-level Agentry test clients.
3. **Fragile Client Runtimes:** Agentry's OpenUI framework bridges native controls through a proprietary C++ communication bridge that cannot keep pace with modern touch paradigms, biometric auth, or modern MDM/MAM containerization (Microsoft Intune, AirWatch).

### Architectural Topology Comparison

```text
LEGACY AGENTRY TOPOLOGY:
┌─────────────────┐       ┌───────────────────────┐       ┌─────────────────────┐
│ Agentry Client  │ ====> │ SMP 3.0 Server        │ ====> │ SAP ECC 6.0 / EHP8  │
│ (C++ / OpenUI)  │ (TCP) │ (Agentry Java Engine) │ (RFC) │ (Custom BAPIs/ABAP) │
└─────────────────┘       └───────────────────────┘       └─────────────────────┘

MODERN BTP / SSAM TOPOLOGY:
┌─────────────────┐       ┌───────────────────────┐       ┌─────────────────────┐
│ SSAM App (MDK)  │ ====> │ SAP BTP Mobile Svc    │ ====> │ SAP S/4HANA Core    │
│ (Native iOS/And)│(HTTPS)│ (Offline OData Engine)│(mTLS) │ (MAIF / OData v4)   │
└─────────────────┘       └───────────────────────┘       └─────────────────────┘
```

---

## Migration Roadmap: Mapping Data & Synchronization Layers

The single largest mental model shift when transitioning from Agentry to SSAM is moving from **Agentry Transactions & Fetches** to **OData Delta Queries & Defining Requests**.

### 1. Complex Tables to Local Offline OData Collections

In Syclo-Agentry, reference datasets (e.g., Plant lists, Work Centers, Code Groups, Catalog Profiles) were stored as **Complex Tables** or **Data Tables**, synced via SQL queries into a local proprietary encrypted database (`AgentryClient.db`).

In SSAM, these become **Defining Requests** within the Offline OData service configuration in SAP BTP Mobile Services:

```json
{
  "Name": "PlantCollection",
  "Query": "/SAPAssetManager/Services/AssetManager.service/Plants?$select=Plant,PlantDescription",
  "AutomaticallyRetrievesStreams": false
}
```

> **Architectural Tip:** Avoid unbounded defining requests. In legacy Agentry, complex tables could download 500,000 rows without immediately killing the client. In Offline OData, downloading 500,000 records into local SQLite UltraLite will bloat the initial sync time to 15+ minutes. Always apply delta tokens and scoped server-side filters.

### 2. Transaction Stepping to MDK Actions & Rules

Agentry handled updates via multi-step transactions: client validation, object creation, server stepping, and RFC execution.

In SSAM, this is orchestrated via declarative **MDK Actions** triggered by **MDK Rules**. The following rule demonstrates handling a dynamic Work Order status transition with safety validation and offline queue commitment:

```javascript
/**
 * MDK Rule: WorkOrderMobileStatusChange.js
 * Converts legacy Agentry WorkOrderUpdate Transaction to SSAM MDK
 * @param {IClientAPI} context
 */
import ODataDate from './ODataDate';

export default async function WorkOrderMobileStatusChange(context) {
  const binding = context.binding;
  const clientData = context.getClientData();
  
  // 1. Verify pre-conditions (Safety Check & Equipment Verification)
  const isSafetyPermitCleared = await context.read(
    '/SAPAssetManager/Services/AssetManager.service',
    `${binding['@odata.readLink']}/WCMDocumentHeaders`,
    [],
    "$filter=PermitActive eq true and IsolationStatus eq 'NORMALIZED'"
  );

  if (!isSafetyPermitCleared || isSafetyPermitCleared.length === 0) {
    return context.executeAction('/SAPAssetManager/Actions/Safety/SafetyPermitBlockedDialog.action');
  }

  // 2. Prepare OData ChangeSet Properties
  clientData.MobileStatus = 'IN_PROGRESS';
  clientData.EffectiveTimestamp = new ODataDate().toISOString();

  // 3. Queue atomic offline OData change to SSAM delta store
  return context.executeAction({
    "Name": "/SAPAssetManager/Actions/Common/GenericUpdate.action",
    "Properties": {
      "Target": {
        "EntitySet": "MyWorkOrderHeaders",
        "Service": "/SAPAssetManager/Services/AssetManager.service",
        "ReadLink": binding['@odata.readLink']
      },
      "Properties": {
        "MobileStatus": clientData.MobileStatus,
        "OrderHeaderChangedDate": clientData.EffectiveTimestamp
      },
      "Headers": {
        "OfflineOData.TransactionID": binding.OrderId
      }
    }
  });
}
```

---

## Backend Modernization: ABAP BAdIs and MAIF

In legacy implementations, custom logic was embedded in `Z_SYCLO_*` function modules, user exits, or custom Agentry Java classes overriding standard fetch steps.

In S/4HANA, SSAM leverages the **Mobile Application Integration Framework (MAIF)**. Instead of modifying core tables or creating non-standard RFC endpoints:

1. **Data Staging & Filtering:** Leverage MAIF Assignment Types (`BAdI /MERP/PM_ORDER_ASSIGNMENT`) to determine exactly which Work Orders, Operations, and Notifications are routed to a specific technician's mobile client.
2. **Entity Extensions:** Extend standard OData entities (`MyWorkOrderHeader`, `MyWorkOrderOperation`) through the SEGW enhancement framework or CDS view extensions, keeping the S/4HANA core **Clean Core compliant**.
3. **Transaction Processing:** Implement customer exits in MAIF class handlers (e.g., `/MERP/CL_PM_WORKORDER_UPDATE`) to execute custom business validations prior to calling standard `BAPI_ALM_ORDER_MAINTAIN`.

### Sample ABAP BAdI Filter for Utility Service Territories

```abap
METHOD /merp/if_pm_order_assign~filter_orders.
  " Filter work orders based on field technician service territory & dynamic qualification
  LOOP AT ct_orders ASSIGNING FIELD-SYMBOL(<ls_order>).
    IF <ls_order>-planplant = '1000' AND <ls_order>-ingrp IN s_territory.
      " Validate technician high-voltage certification
      IF check_technician_clearance( iv_user = sy-uname iv_order = <ls_order>-aufnr ) = abap_true.
        <ls_order>-mobile_sync_flag = abap_true.
      ELSE.
        <ls_order>-mobile_sync_flag = abap_false.
      ENDIF.
    ENDIF.
  ENDLOOP.
ENDMETHOD.
```

---

## Handling Complex Scenarios: WCM & Field Inspections

Two areas that cause the greatest friction during Agentry-to-SSAM migrations are **Work Clearance Management (WCM)** and **Field Forms**:

### 1. Work Clearance Management (WCM)
Legacy Work Manager implementations often relied on heavily customized screens to display tagging lists, operational steps, and lock/tag IDs. 

In SSAM, WCM is supported natively through dedicated Operational WCM components. Migration requires:
- Normalizing custom customer tagging statuses to standard SAP WCM isolation cycles (`PREPARED`, `TAGGED`, `UNTAGGED`).
- Utilizing MDK Section Pages to present multi-step tag confirmation flows with cryptographic timestamp verification.

### 2. Replacing Proprietary Agentry Dynamic Forms
Legacy setups used custom Syclo Agentry screens or embedded PDF generation for job hazard assessments. Modern architectures integrate **SAP Dynamic Forms (powered by SmartForms/HTML5)** or **Mirata Forms**, delivering:
- Responsive, offline-capable digital forms rendered inside native MDK webview wrappers.
- Automatic payload bundling during the standard SSAM OData flush cycle.

---

## Migration Checklist: Lessons from Tier-1 Utility Rollouts

| Phase | Milestone | Critical Architectural Checkpoint |
| :--- | :--- | :--- |
| **Discovery** | Logic Inventory | Catalog all proprietary Syclo Java classes and map each directly to MDK rules or backend BAdIs. |
| **Data Design** | Defining Request Scoping | Benchmark initial sync times over simulated 3G/LTE throttling; keep initial database payload < 80MB. |
| **Integration** | Cloud Connector & BTP | Configure principal propagation via X.509 client certificates or OAuth tokens to avoid generic service users. |
| **Packaging** | Custom MDK Branding | Bundle custom native plugins (camera, barcode scanners, GIS layers) into branded iOS IPA and Android APKs. |
| **Cutover** | Dual-Run Strategy | Run pilot service territories in parallel; ensure legacy Syclo delta queue and MAIF delta queue do not create database lock collisions. |

---

## Summary

Migrating from Syclo-Agentry to SAP Service & Asset Manager on S/4HANA is not merely a UI rewrite—it is a strategic re-platforming that unlocks cloud elasticity, zero-trust mobile security, and sub-second offline delta synchronization for field operatives.

By respecting S/4HANA Clean Core boundaries, structuring MAIF assignment filters, and mastering MDK offline OData mechanics, enterprise architects can decommission aging legacy servers and empower field teams with a resilient, modern digital workspace.
