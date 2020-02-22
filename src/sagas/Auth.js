import { all, call, fork, put, takeEvery } from "redux-saga/effects";
import swal from 'sweetalert';
import rsf from '../firebase/firebase'
import {
  auth,
  facebookAuthProvider,
  githubAuthProvider,
  googleAuthProvider,
  twitterAuthProvider,
} from "../firebase/firebase";
import {
  SIGNIN_FACEBOOK_USER,
  SIGNIN_GITHUB_USER,
  SIGNIN_GOOGLE_USER,
  SIGNIN_TWITTER_USER,
  SIGNIN_USER,
  SIGNOUT_USER,
  SIGNUP_USER
} from "constants/ActionTypes";
import { showAuthMessage, userSignInSuccess, userSignOutSuccess, userSignUpSuccess } from "actions/Auth";
import {
  userFacebookSignInSuccess,
  userGithubSignInSuccess,
  userGoogleSignInSuccess,
  userTwitterSignInSuccess
} from "../actions/Auth";

let isEmailVerified = false;

function sendVerify() {
  const user = auth.currentUser;
  user.sendEmailVerification({
    url: "http://malpay-web.firebaseapp.com/signin"
  }).then(function () {
    swal({
      title: "Verification Email Sent!",
      text: "Please, Check Your Email for Confirmation",
      icon: "success",
      dangerMode: true,
    });

    setTimeout(function () {
      const url = "http://malpay-web.firebaseapp.com/signin";
      window.location.href = url
    }, 1000);

  }).catch(function (error) {
    swal({
      title: error,
      icon: "danger",
      dangerMode: true,
    });
  });
}

const createUserWithEmailPasswordRequest = async (email, password) =>
  await auth.createUserWithEmailAndPassword(email, password)
    .then(authUser => authUser)
    .catch(error => error);

const signInUserWithEmailPasswordRequest = async (email, password) =>
  await auth.signInWithEmailAndPassword(email, password)
    .then(authUser => authUser)
    .catch(error => error
    );

const signOutRequest = async () =>
  await auth.signOut()
    .then(authUser => authUser)
    .catch(error => error);


const signInUserWithGoogleRequest = async () =>
  await auth.signInWithPopup(googleAuthProvider)
    .then(authUser => authUser)
    .catch(error => error);

const signInUserWithFacebookRequest = async () =>
  await auth.signInWithPopup(facebookAuthProvider)
    .then(authUser => authUser)
    .catch(error => error);

const signInUserWithGithubRequest = async () =>
  await auth.signInWithPopup(githubAuthProvider)
    .then(authUser => authUser)
    .catch(error => error);

const signInUserWithTwitterRequest = async () =>
  await auth.signInWithPopup(twitterAuthProvider)
    .then(authUser => authUser)
    .catch(error => error);


function* createUserWithEmailPassword({ payload }) {
  const { phone, name, email, password } = payload;
  const user = auth.currentUser;
  try {
    const signUpUser = yield call(createUserWithEmailPasswordRequest, email, password);
    yield call(rsf.firestore.setDocument, `users/${signUpUser.user.uid}`, { email: email, name: name, phone: phone, isVerified: false });
    if (signUpUser.message) {
      yield put(showAuthMessage(signUpUser.message));
    } else {
      sendVerify();
      if (user) {
        if (user.emailVerified === true) {
          // localStorage.setItem('user_id', signUpUser.user.uid);
          yield put(userSignUpSuccess(signUpUser.user.uid));
        } else {

        }
      }

    }
  } catch (error) {
    yield put(showAuthMessage(error));
  }
}

function* signInUserWithGoogle() {
  try {
    const signUpUser = yield call(signInUserWithGoogleRequest);
    if (signUpUser.message) {
      yield put(showAuthMessage(signUpUser.message));
    } else {
      localStorage.setItem('user_id', signUpUser.user.uid);
      yield put(userGoogleSignInSuccess(signUpUser.user.uid));
    }
  } catch (error) {
    yield put(showAuthMessage(error));
  }
}


function* signInUserWithFacebook() {
  try {
    const signUpUser = yield call(signInUserWithFacebookRequest);
    if (signUpUser.message) {
      yield put(showAuthMessage(signUpUser.message));
    } else {
      localStorage.setItem('user_id', signUpUser.user.uid);
      yield put(userFacebookSignInSuccess(signUpUser.user.uid));
    }
  } catch (error) {
    yield put(showAuthMessage(error));
  }
}


function* signInUserWithGithub() {
  try {
    const signUpUser = yield call(signInUserWithGithubRequest);
    if (signUpUser.message) {
      yield put(showAuthMessage(signUpUser.message));
    } else {
      localStorage.setItem('user_id', signUpUser.user.uid);
      yield put(userGithubSignInSuccess(signUpUser.user.uid));
    }
  } catch (error) {
    yield put(showAuthMessage(error));
  }
}


function* signInUserWithTwitter() {
  try {
    const signUpUser = yield call(signInUserWithTwitterRequest);
    if (signUpUser.message) {
      if (signUpUser.message.length > 100) {
        yield put(showAuthMessage('Your request has been canceled.'));
      } else {
        yield put(showAuthMessage(signUpUser.message));
      }
    } else {
      localStorage.setItem('user_id', signUpUser.user.uid);
      yield put(userTwitterSignInSuccess(signUpUser.user.uid));
    }
  } catch (error) {
    yield put(showAuthMessage(error));
  }
}


function* signInUserWithEmailPassword({ payload }) {
  const { email, password } = payload;
  try {
    const signInUser = yield call(signInUserWithEmailPasswordRequest, email, password);
    const user = auth.currentUser;
    const snapshot = yield call(rsf.firestore.getCollection, 'users');
    let userData;
    snapshot.forEach(users => {
      userData = users.data();
    });
    if (signInUser.message) {
      yield put(showAuthMessage(signInUser.message));
      auth.onAuthStateChanged(function (user) {
        if (user) {
          if (user.emailVerified === false) {

          } else {
            isEmailVerified = true;
          }
        } else {

        }
      });
    } else if (!user.emailVerified) {
      auth.onAuthStateChanged(function (user) {
        if (user) {
          if (user.emailVerified === false) {
            swal({
              title: "Email Address is not Verified!",
              text: "Please, Check Your Email for Confirmation",
              icon: "warning",
              dangerMode: true,
            });
            window.location.reload();
          } else {
            isEmailVerified = true;
          }
        } else {
          swal({
            title: "Logged Out!",
            icon: "success",
            dangerMode: true,
          });
        }
      });
    } else if (!user) {
      swal({
        title: "Logged Out!",
        icon: "success",
        dangerMode: true,
      });
    } else {
      yield call(rsf.firestore.updateDocument, `users/${signInUser.user.uid}`, 'isVerified', true);
      yield put(userSignInSuccess(userData));
      localStorage.setItem('user_id', signInUser.user.uid);
      yield put(userSignInSuccess(signInUser.user.uid));
      // console.log(userData);
    }
  } catch (error) {
    yield put(showAuthMessage(error));
  }
}

function* signOut() {
  try {
    const signOutUser = yield call(signOutRequest);
    if (signOutUser === undefined) {
      localStorage.removeItem('user_id');
      yield put(userSignOutSuccess(signOutUser));
    } else {
      yield put(showAuthMessage(signOutUser.message));
    }
  } catch (error) {
    yield put(showAuthMessage(error));
  }
}

export function* createUserAccount() {
  yield takeEvery(SIGNUP_USER, createUserWithEmailPassword);
}

export function* signInWithGoogle() {
  yield takeEvery(SIGNIN_GOOGLE_USER, signInUserWithGoogle);
}

export function* signInWithFacebook() {
  yield takeEvery(SIGNIN_FACEBOOK_USER, signInUserWithFacebook);
}

export function* signInWithTwitter() {
  yield takeEvery(SIGNIN_TWITTER_USER, signInUserWithTwitter);
}

export function* signInWithGithub() {
  yield takeEvery(SIGNIN_GITHUB_USER, signInUserWithGithub);
}

export function* signInUser() {
  yield takeEvery(SIGNIN_USER, signInUserWithEmailPassword);
}

export function* signOutUser() {
  yield takeEvery(SIGNOUT_USER, signOut);
}

export default function* rootSaga() {
  yield all([fork(signInUser),
  fork(createUserAccount),
  fork(signInWithGoogle),
  fork(signInWithFacebook),
  fork(signInWithTwitter),
  fork(signInWithGithub),
  fork(signOutUser)]);
}