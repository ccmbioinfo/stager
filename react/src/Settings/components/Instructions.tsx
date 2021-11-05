import React from "react";
import { Divider, Link, makeStyles, Paper, Typography, TypographyProps } from "@material-ui/core";
import { GetApp, Publish } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
    instructions: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
    },
    subheading: {
        paddingTop: theme.spacing(2),
    },
    conclusion: {
        paddingTop: theme.spacing(2),
    },
}));

const P = (props: TypographyProps) => <Typography variant="body1" gutterBottom {...props} />;

export default function Instructions() {
    const classes = useStyles();
    return (
        <Paper className={classes.instructions}>
            <Typography variant="h4" component="h2" gutterBottom>
                Using MinIO with {process.env.REACT_APP_NAME}
            </Typography>
            <P>
                <Link href="https://min.io/" rel="noreferrer" color="textSecondary">
                    MinIO
                </Link>{" "}
                is an open-source{" "}
                <Link href="https://aws.amazon.com/s3/" rel="noreferrer" color="textSecondary">
                    Amazon S3
                </Link>
                -compatible object storage server. We're using an instance managed by{" "}
                {process.env.REACT_APP_NAME} as a central data lake for uploaded dataset files. You
                can retrieve or reset your credentials for this instance above and then go to MinIO
                to sign in through your browser. You should see buckets that correspond to each{" "}
                {process.env.REACT_APP_NAME} permission group that you belong to. Everybody in the
                permission group may upload files to the corresponding bucket, but only site
                administrators may delete files once they're uploaded to MinIO.
            </P>
            <P>
                For files larger than 64 MB, it is recommended to use an S3-aware client that can
                handle multipart uploads, rather than the browser. The following instructions
                pertain to the{" "}
                <Link
                    href="https://docs.min.io/docs/minio-client-complete-guide.html"
                    rel="noreferrer"
                    color="textSecondary"
                >
                    command-line MinIO Client
                </Link>
                .
            </P>
            <Typography variant="h6" gutterBottom>
                <Link
                    href="https://docs.min.io/docs/minio-client-quickstart-guide.html"
                    rel="noreferrer"
                    color="textSecondary"
                >
                    <GetApp /> Download the MinIO Client for your operating system here.
                </Link>
            </Typography>
            <P>
                This is a single executable that you can keep in any folder outside your Downloads;
                it does not need to be installed system-wide. To use the MinIO Client, you will need
                to open a terminal window in the same folder. On Windows, you can do this by{" "}
                <kbd>
                    <kbd>Shift</kbd> + <kbd>Right Click</kbd>
                </kbd>{" "}
                in the folder and selecting <samp>Open PowerShell window here</samp>.
            </P>
            <P>
                We will now register our {process.env.REACT_APP_NAME}-managed MinIO server with your
                local client. You will only need to do this once. Input the following command into
                the terminal window and hit Enter. Paste your access key and secret key from above
                when prompted. On Windows, you can right-click in the terminal to paste. Note that
                the secret key will be hidden.
            </P>
            <P>
                <code>.\mc config host add minio {process.env.REACT_APP_MINIO_URL}</code>
            </P>
            <P>
                You can replace <code>minio</code> above with any other alias for this MinIO
                instance, as long as you are consistent. On macOS and Linux, use a forward slash
                instead of a backward slash if you did not install <code>mc</code> system-wide.
            </P>
            <Typography variant="h6" gutterBottom className={classes.subheading}>
                <Publish /> General usage
            </Typography>
            <P>
                The MinIO Client supports many familiar shell commands for filesystem access. To
                verify that we can connect, try out the following commands:
            </P>
            <P>
                <code>.\mc ls minio</code>
            </P>
            <P>This should show a list of buckets like you see in the browser.</P>
            <P>
                <code>.\mc ls minio/BUCKETNAME</code>
            </P>
            <P>
                This should show all the files in the bucket called <code>BUCKETNAME</code>.
            </P>
            <P>
                Uploading files with <code>mc</code> also verifies checksums when the transfer is
                complete and automatically retries on errors. You can specify any number of relative
                or absolute paths to files, separated by spaces.
            </P>
            <P>
                <code>.\mc cp FILE_ONE FILE_TWO FILE_ETC minio/BUCKETNAME</code>
            </P>
            <P>We can also transfer entire folders at once.</P>
            <P>
                <code>.\mc cp --recursive FOLDER_ONE FOLDER_TWO FILE_ONE minio/BUCKETNAME</code>
            </P>
            <P>
                Once files are uploaded to MinIO, they will become available in{" "}
                {process.env.REACT_APP_NAME} for users in the corresponding permission group to link
                to new or existing dataset metadata.
            </P>
            <Divider />
            <P className={classes.conclusion}>
                Full documentation is available from MinIO's{" "}
                <Link
                    href="https://docs.min.io/docs/minio-client-complete-guide.html"
                    rel="noreferrer"
                    color="textSecondary"
                >
                    documentation site
                </Link>
                . You can also ask the {process.env.REACT_APP_NAME} team any questions at the shared
                inbox{" "}
                <Link href={`mailto:${process.env.REACT_APP_EMAIL}`} color="textSecondary">
                    {process.env.REACT_APP_EMAIL}
                </Link>
                .
            </P>
        </Paper>
    );
}
