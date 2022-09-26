document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document
    .querySelector('#inbox')
    .addEventListener('click', () => renderInbox());
  document.querySelector('#sent').addEventListener('click', () => renderSent());
  document
    .querySelector('#archived')
    .addEventListener('click', () => renderArchive());
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', (e) => {
    e.preventDefault();
    sendEmail();
  });
  // By default, load the inbox
  renderInbox();
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  let receiver = document.querySelector('#compose-recipients');
  let sub = document.querySelector('#compose-subject');
  receiver.disabled = false;
  sub.disabled = false;
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
}

// Let's do some Fun..^_^
function sendEmail() {
  let receiver = document.querySelector('#compose-recipients').value;
  let sub = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: receiver,
      subject: sub,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // Print result
      let message = document.querySelector('.message');
      let err = document.querySelector('.err');
      if (result.message) {
        load_mailbox('sent');
        setTimeout(() => {
          message.classList.remove('display-none');
          message.innerHTML = result.message;
          setTimeout(() => {
            message.innerHTML = '';
            message.classList.add('display-none');
          }, 4000);
        }, 300);
        renderSent();
      } else {
        compose_email();
        err.classList.remove('display-none');
        err.innerHTML = result.error;
        setTimeout(() => {
          err.classList.add('display-none');
        }, 3000);
      }
      console.log(result);
    });
}
function renderInbox() {
  load_mailbox('inbox');
  fetch('/emails/inbox')
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => createCard(email, 'inbox'));
      console.log(emails);
    });
}
function renderSent() {
  load_mailbox('sent');
  fetch('/emails/sent')
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => createCard(email, 'sent'));
      console.log(emails);
    });
}
// which kind of card need to create ..?
function createCard(email, state) {
  const emailViews = document.querySelector('#emails-view');
  const card = document.createElement('div');
  let btnArch = '';
  card.id = email.id;
  if (state === 'inbox') {
    if (email.read) card.classList.add('read');
    btnArch = `
      <button class="btn btn-sm btn-warning icon">
      <i class="fa-solid fa-share"></i>
      </button>
    `;
  }

  card.classList.add('myCard', 'btn', 'btn-outline-light');
  let sender = `From: ${email.sender}`;
  if (state === 'sent') sender = `To: ${email.recipients}`;
  const subject = email.subject;
  const time = email.timestamp;
  card.innerHTML = `
    <p>${sender}</p>
    <p>${subject}</p>
    <small>${time}</small>
    ${btnArch}
  `;
  emailViews.append(card);
  card.onclick = function () {
    renderEmailView(email);
  };
  document.querySelectorAll('.icon').forEach((elm) => {
    elm.onclick = (e) => {
      ArcAndUnArc(email);
      e.stopPropagation();
    };
  });
}

function renderArchive() {
  load_mailbox('archive');
  fetch('/emails/archive ')
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => createCard(email, 'archive'));
      console.log(emails);
    });
}
async function renderEmailView(email) {
  const myView = document.querySelector('#emails-view');
  myView.innerHTML = '';
  const infoEmail = document.createElement('div');
  const br = document.createElement('hr');
  infoEmail.classList.add('info-email');
  let btnArch = ``;
  let btnUnArc = ``;
  let btnReply = ``;
  let check = await addButtons(email);
  if (check) {
    if (email.archived) {
      btnUnArc = `<button  type="button" class="btn btn-outline-warning arc"> unArchive</button>`;
    } else {
      btnArch = `<button  type="button" class="btn btn-outline-info arc">Archive</button>`;
    }
    btnReply = `<button type="button" class="btn btn-outline-light rep">Reply</button>`;
  }
  infoEmail.innerHTML = `
    <p>From:<span> ${email.sender}</span></p>
    <p>To:<span> ${email.recipients}</span></p>
    <p>Subject:<span> ${email.subject}</span></p>
    <p>Time Stamp: <small> ${email.timestamp}</small></p>
    ${btnReply}
    ${btnUnArc}
    ${btnArch}
    `;
  myView.append(infoEmail);
  myView.append(br);
  const emailBody = document.createElement('div');
  emailBody.innerHTML = `
    <section style= "color: #fff;">${email.body}</section>
  `;
  myView.append(emailBody);
  markAsRead(email);
  if (check) {
    document.querySelector('.arc').addEventListener('click', () => {
      ArcAndUnArc(email);
    });
    document.querySelector('.rep').addEventListener('click', () => {
      prepareReply(email);
    });
  }
}
function markAsRead(email) {
  if (email.read) return;
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    }),
  });
}
async function ArcAndUnArc(email) {
  await fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived,
    }),
  });
  renderInbox();
}
async function addButtons(email) {
  let check = await fetch('/emails/sent')
    .then((response) => response.json())
    .then((emails) => {
      for (let i = 0; i < emails.length; i++) {
        if (emails[i].id == email.id) return false;
      }
      return true;
    });
  return check;
}
function prepareReply(email) {
  compose_email();
  let sender = document.querySelector('#compose-sender');
  let receiver = document.querySelector('#compose-recipients');
  let sub = document.querySelector('#compose-subject');
  let body = document.querySelector('#compose-body');
  sender.value = email.recipients;
  receiver.value = email.sender;
  receiver.disabled = true;
  sub.disabled = true;
  sub.value = email.subject;
  if (email.subject.slice(0, 3).toUpperCase() !== 'RE:') {
    sub.value = `Re: ${email.subject}`;
  }
  body.value = `\n\n>> On ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
}
