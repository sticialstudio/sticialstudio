import { getDigitalPinOptions, getAnalogPinOptions, getPWMPinOptions } from '../dropdowns';

export const robotBlocks = [
{
            type: "robot_move_forward",
            message0: "move robot forward ⚙️",
            previousStatement: null,
            nextStatement: null,
            style: "actuator_blocks",
            tooltip: "Move the robot forward using motors 1 and 2."
        },
        {
            type: "robot_move_backward",
            message0: "move robot backward ⚙️",
            previousStatement: null,
            nextStatement: null,
            style: "actuator_blocks",
            tooltip: "Move the robot backward using motors 1 and 2."
        },
        {
            type: "robot_turn_left",
            message0: "turn robot left ⚙️",
            previousStatement: null,
            nextStatement: null,
            style: "actuator_blocks",
            tooltip: "Turn the robot left by reversing motor 1 and moving motor 2 forward."
        },
        {
            type: "robot_turn_right",
            message0: "turn robot right ⚙️",
            previousStatement: null,
            nextStatement: null,
            style: "actuator_blocks",
            tooltip: "Turn the robot right by moving motor 1 forward and reversing motor 2."
        },
        {
            type: "robot_stop",
            message0: "stop robot ⚙️",
            previousStatement: null,
            nextStatement: null,
            style: "actuator_blocks",
            tooltip: "Stop the robot by releasing both motors."
        },
        {
            type: "robot_move_speed",
            message0: "move forward with speed %1 %% ⚙️",
            args0: [
                {
                    type: "input_value",
                    name: "SPEED",
                    check: "Number"
                }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "actuator_blocks",
            tooltip: "Move the robot forward at a specific speed (0-100%)."
        }
];
