# VT-Digital-Assessment

## >> Getting Started << DO THIS FIRST!

```shell
# VT CS GitLab (git.cs.vt.edu)
# HTTPS
git clone https://git.cs.vt.edu/andrewt03/VT-Digital-Assessment.git
# SSH (Recommended)
git clone git@git.cs.vt.edu:andrewt03/VT-Digital-Assessment.git

# VT CS GitLab (code.vt.edu)
# HTTPS
git clone https://code.vt.edu/andrewt03/vt-digital-assessment.git
# SSH (Recommended)
git clone git@code.vt.edu:andrewt03/vt-digital-assessment.git

# GitHub
# HTTPS
git clone https://github.com/AndrewTran03/VT-Digital-Assessment.git
# SSH (Recommended)
git clone git@github.com:AndrewTran03/VT-Digital-Assessment.git
```

```shell
# Create a frontend terminal
cd client/
npm install --legacy-peer-deps
sh run_frontend.sh
```

```shell
# Create a backend terminal
cd server/
npm install
sh run_backend.sh
```

`NOTE`: Please create a `.env` file (and structure it similarly to the `.env.sample` provided) and then populate it your Canvas API key first before running this application locally. If you do not have a `Canvas API Token`, please follow the steps outlined in the `Addendum: Creating a Canvas API Token` section (as shown below). Additionally, if you would like to see the `.drawio` files in the `system-design` directory, please install the [Draw.io Integration](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio) Extension on Visual Studio Code.

- In your cloned repository:
```shell
cd server/
touch .env
cp .env.sample .env
# Please add your API token on the `CANVAS_PUBLIC_API_TOKEN` line in quotations for safe-keeping as well as to make the backend work!
cp .env .env.development
cp .env .env.production
# ^^^ Note: Only do this once you have finished editing the .env file and then will be pushing code into development/staging/production! ^^^
# Typically, for staging/production, it is recommended to add 1 to the 'FRONTEND_PORT' and 'BACKEND_PORT' properties when compared to development property configurations.
```

- To commit development code into Docker containers and push to CS Cloud:
```shell
cd deployment/
sh docker_deployment.sh
```

# Addendum: Creating a Canvas API Token

- Go to your Canvas site (VT: [Canvas](https://canvas.vt.edu/)).
- Go to the top-left to your icon and click `Account`.
- Navigate to `Settings`.
- Scroll down until you see the `Approved Integrations` section. Click `+ New Access Token`.
- Fill in the `Purpose` section with your reason for generating a Canvas API token and set your desired expiration date in the `Expires` row. Then, click `Generate Token`.
- You will then see your `API Token`. Save this someplace safe as it will be generated only this once, and you cannot see it again. If you lose the token, you need to regenerate it again using the steps above.

## Useful Production Links:

- VT CS Cloud Website (`Discovery` Cluster) - Frontend: https://vt-digital-assessment.discovery.cs.vt.edu/
- VT CS Cloud Website (`Discovery` Cluster) - Backend: https://vt-digital-assessment-server.discovery.cs.vt.edu/
- VT CS Cloud Website (`Endeavour` Cluster) - Frontend: https://vt-digital-assessment.endeavour.cs.vt.edu/
- VT CS Cloud Website (`Endeavour` Cluster) - Backend: https://vt-digital-assessment-server.endeavour.cs.vt.edu/

## Useful Development Links (LOCAL ONLY):

- Frontend: https://vt-digital-assessment.localhost.devcom.vt.edu/
OR http://localhost:5001/
- Backend: https://vt-digital-assessment-server.localhost.devcom.vt.edu/ OR http://localhost:3001/
- Traefik Dashboard: http://localhost:8000/

## Extra Resources:

- [Canvas Live API](https://canvas.vt.edu/doc/api/live#!/assignments.json/list_assignments_assignments_get_1) 

# Extra GitLab README Generated Instructions

## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://code.vt.edu/andrewt03/vt-digital-assessment.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://code.vt.edu/andrewt03/vt-digital-assessment/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/ee/user/project/merge_requests/merge_when_pipeline_succeeds.html)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/index.html)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
