# ![Stager](/react/src/assets/brand.png)

[![backend CI](https://github.com/ccmbioinfo/stager/actions/workflows/flask.yml/badge.svg)](https://github.com/ccmbioinfo/stager/actions/workflows/flask.yml)
[![frontend CI](https://github.com/ccmbioinfo/stager/actions/workflows/react.yml/badge.svg)](https://github.com/ccmbioinfo/stager/actions/workflows/react.yml)
[![codecov](https://codecov.io/gh/ccmbioinfo/stager/branch/master/graph/badge.svg?token=SQT23JSX3J)](https://codecov.io/gh/ccmbioinfo/stager)
[![CodeQL](https://github.com/ccmbioinfo/stager/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/ccmbioinfo/stager/actions/workflows/codeql-analysis.yml)

Stager is a web application that enables information management for large-scale genomics and other omics projects. It allows users to input genomic metadata and edit annotations, link them to the relevant data sets, request specific analyses and track their status. It was initially developed for the needs of [Care4Rare](http://care4rare.ca/) &mdash; a pan-Canadian collaborative team of clinicians, bioinformaticians, scientists, and researchers, focused on improving the care of Rare Disease patients in Canada and around the world. Led out of the Children’s Hospital of Eastern Ontario (CHEO) [Research Institute](https://www.cheoresearch.ca/) in Ottawa, Canada, Care4Rare includes 21 academic sites across Canada, and is recognized internationally as a pioneer in the field of genomics and personalized medicine. [Genomics4RD](https://www.genomics4rd.ca/) is a research initiative by Care4Rare with the mission to create the first data lake for rare diseases in Canada. Genomics4RD is a bioinformatics ecosystem that consists of multiple projects, with Stager enabling its data maintenance, storage and analysis capabilities.

The [Centre for Computational Medicine](https://ccm.sickkids.ca/) at SickKids supports this collaboration through developing bioinformatics pipelines and analyzing genomic datasets. The analyses are monitored by Stager and users can retrieve aggregated reports on detected genomic variants. The integrated system supports both structured and unstructured data types through the combined use of MinIO and Stager. MinIO offers a number of security features for user identity and access management. In particular, the data sets from separate sources or subprojects are deposited into their specialized data folders, called buckets, where secure access to each bucket is provided only to the relevant project participants. Once the data sets are transferred, analyses are enabled using a suite of bioinformatics pipelines for the corresponding data types.

Access to Stager is restricted to team members who provide data and metadata or perform data analysis. Key features of Stager are:

- Viewing and editing metadata for participants and datasets
- Uploading new metadata for participants and datasets
- Uploading dataset files and linking them to the metadata
- Requesting analyses for datasets
- Viewing aggregated analysis reports in the variant viewer

## Tech stack

The browser single-page application frontend is written in [TypeScript](https://www.typescriptlang.org/docs) with the [React](https://reactjs.org/docs/getting-started.html) library, bootstrapped via [Create React App](https://create-react-app.dev/docs/getting-started/), and uses [Material-UI](https://v4.mui.com/) for theming.

The backend is containerized with Docker and written in Python 3.7 with the [Flask]((https://flask.palletsprojects.com/)) microframework and [SQLAlchemy](https://docs.sqlalchemy.org/) object-relational mapper, presenting a RESTful API to the frontend.

A [MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/) database stores the aforementioned dataset and analysis metadata

[MinIO](https://docs.min.io/), an S3-compatible object storage server, is used to store the actual datasets uploaded and the results of their analyses

The first-party frontend and backend components are built automatically on the GitHub Actions continuous integration system. The frontend is transpiled for the web and deployed as a set of static files. The backend is deployed with Docker Compose.

For more developer documentation, see [`docs/`](https://github.com/ccmbioinfo/stager/tree/master/docs/)

### Required tools and editors

- [Git](https://git-scm.com/doc)
- [Docker](https://docs.docker.com/engine/install/) and [Compose](https://docs.docker.com/compose/install/)
- [Visual Studio Code](https://code.visualstudio.com/) or [PyCharm](https://www.jetbrains.com/pycharm/)
