---
title: Production-scale Containerized Game Platform Practice in Bytedance
---

By Chenyu Jiang, ByteDance, Inc & Viktor Farcic, Upbound

Classical games servers are running on physical machines or virtual machines to provide services to players. However, packaging game servers as in containers is quickly gaining traction across the tech landscape because of container's isolated runtime paradigm, cost efficiency and elasticity. In Bytedance, games is one of the major vertical domains and we need a mature games-centric platform to serve games from both in-house games studios and agents of game manufacturers globally. In this talk, a Bytedance's practice will be shared in establishing a Kubernetes based Game platform. It leverages multiple CNCF open source frameworks: Crossplane, KubeVela, Agones to address challenges and requirements for games to go cloud-native, such as game servers and dependency resource deployment in multi-cloud/multi-region, game servers orchestration and stateful games service autoscaling.

> This video is posted in 2022-06-02.

<iframe width="560" height="315" src="https://www.youtube.com/embed/bHDPCuCCH0E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>