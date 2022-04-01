/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

// Automated tests

#[cfg(test)]
use std::env;
use std::thread;
use std::time::Duration;

// Zowe daemon executable modules
use crate::defs::*;
use crate::proc::*;
use crate::run::*;
use crate::util::*;

#[test]
fn unit_test_get_socket_string() {
    // expect default port with no env
    let socket_string = util_get_socket_string();
    assert!(!socket_string.contains("NotADaemon"));

    // expect override port with env
    env::set_var("ZOWE_DAEMON", "NotADaemon");
    let socket_string = util_get_socket_string();
    assert!(socket_string.contains("NotADaemon"));
    env::remove_var("ZOWE_DAEMON");
}

#[test]
fn unit_test_get_zowe_env() {
    let env = util_get_zowe_env();
    assert_eq!(env.get("ZOWE_EDITOR"), None);

    env::set_var("ZOWE_EDITOR", "nano");
    let env = util_get_zowe_env();
    assert_eq!(env.get("ZOWE_EDITOR"), Some(&"nano".to_owned()));

    env::remove_var("ZOWE_EDITOR");
}

#[test]
// test daemon restart
fn integration_test_restart() {
    let njs_zowe_path = util_get_nodejs_zowe_path();

    let mut daemon_proc_info = proc_get_daemon_info();
    if daemon_proc_info.is_running {
        println!("--- test_restart: To initializes test, stop a running daemon.");
        let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
        if let Err(err_val) = run_daemon_command(&njs_zowe_path, &mut restart_cmd_args) {
            assert_eq!("Shutdown should have worked", "Shutdown failed", "exit code = {}", err_val);
        }

        // confirm that the daemon has stopped
        daemon_proc_info = proc_get_daemon_info();
        assert_eq!(daemon_proc_info.is_running, false, "The daemon did not stop.");
    }

    // now try the restart
    println!("--- test_restart: Run a restart when no daemon is running.");
    let result = run_restart_command(&njs_zowe_path);
    assert_eq!(result.unwrap(), 0, "The run_restart_command failed.");

    // confirm that the daemon is running
    thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
    daemon_proc_info = proc_get_daemon_info();
    assert_eq!(daemon_proc_info.is_running, true, "The daemon is not running after restart.");
    let first_daemon_pid = daemon_proc_info.pid;

    println!("--- test_restart: Run a restart with a daemon already running.");
    let result = run_restart_command(&njs_zowe_path);
    assert_eq!(result.unwrap(), 0, "The run_restart_command failed.");

    // confirm that a new and different daemon is running
    thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
    daemon_proc_info = proc_get_daemon_info();
    assert_eq!(daemon_proc_info.is_running, true, "A daemon should be running now.");
    assert_ne!(daemon_proc_info.pid, first_daemon_pid,
        "Last pid = {} should not equal current PID = {}", first_daemon_pid, daemon_proc_info.pid,
    );

    // As a cleanup step, stop the daemon
    println!("--- test_restart: To cleanup, stop the running daemon.");
    let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
    if let Err(_err_val) = run_daemon_command(&njs_zowe_path, &mut restart_cmd_args) {
        assert_eq!("Shutdown should have worked", "Shutdown failed");
    }

    // confirm that the daemon has stopped
    thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
    daemon_proc_info = proc_get_daemon_info();
    assert_eq!(daemon_proc_info.is_running, false, "The daemon should have stopped for the end of the test.");
}
