---
title: Usage Data Collection in VelaUX
---

VelaUX can send anonymous usage statistics to the KubeVela maintainers, to show which features people use. It is on by default, and it follows the [CNCF telemetry data collection and usage policy](https://www.linuxfoundation.org/telemetry-data-policy/).

## Turn it off

Go to **Platform Setting > User experience improvement plan**, switch **Contribution** off, and click **Submit**. Nothing else in VelaUX depends on it.

## What is sent

Once a day, VelaUX's server counts what is in its own datastore and in the cluster. When someone opens VelaUX, their browser sends the latest counts, at most once every 24 hours per browser:

| Field | What it holds |
| --- | --- |
| `platformID` | A random ID generated when VelaUX is installed. |
| `installTime` | When VelaUX was installed. |
| `version` | The KubeVela version. |
| `clusterCount` | The number of clusters, as a range such as `<3` or `<10`. |
| `appCount` | The number of VelaUX applications, as a range such as `<10` or `<50`. |
| `enableAddonList` | Each installed addon's name and whether it is enabled, enabling or disabling. |
| `componentDefinitionTopList`, `traitDefinitionTopList`, `workflowStepDefinitionTopList`, `policyDefinitionTopList` | The five most used component, trait, workflow step and policy types. |
| `browserInfo` | The browser's language, name and version, and screen size. |

No application names, resource contents, user names or credentials are sent.

## Where it goes

The browser posts the data to `https://telemetry.kubevela.net/collecting`. That host no longer resolves, so at present nothing is received.
